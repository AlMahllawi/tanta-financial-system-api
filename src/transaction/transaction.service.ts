import { HttpStatus, Injectable } from '@nestjs/common';
import { instanceToPlain, plainToInstance } from 'class-transformer';

import { Prisma } from '../../prisma/generated/client.js';
import {
  NotificationType,
  TransactionForwardStatus,
  TransactionPriority,
  UserRole,
} from '../../prisma/generated/enums.js';
import { ErrorCode } from '../common/enums/error-codes.enum.js';
import { NotificationCode } from '../common/enums/notification-codes.enum.js';
import { ApiException } from '../common/exceptions/api.exception.js';
import { getDownloadURI } from '../common/utils/document.util.js';
import {
  createPaginatedResult,
  createPaginator,
} from '../common/utils/pagination.util.js';
import { Document } from '../document/entities/document.entity.js';
import { NotificationService } from '../notification/notification.service.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { CreateTransactionDto } from './dto/create-transaction.dto.js';
import { TransactionQueryDto } from './dto/transaction-query.dto.js';
import { UpdateTransactionDto } from './dto/update-transaction.dto.js';
import { Transaction } from './entities/transaction.entity.js';
import { TransactionSummary } from './entities/transaction-summary.entity.js';
import { TransactionQuery } from './enums/transaction-query.enum.js';

const TRANSACTION_INCLUDE = {
  documents: {
    include: {
      document: true,
    },
  },
  latestForward: {
    select: { status: true },
  },
} satisfies Prisma.TransactionInclude;

type TransactionWithDocuments = Prisma.TransactionGetPayload<{
  include: typeof TRANSACTION_INCLUDE;
}>;

@Injectable()
export class TransactionService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notificationService: NotificationService,
  ) {}

  private getParticipantWhere(userId: number): Prisma.TransactionWhereInput {
    return {
      OR: [
        { creatorId: userId },
        {
          forwards: {
            some: {
              OR: [{ senderId: userId }, { receiverId: userId }],
            },
          },
        },
      ],
    };
  }

  private getInboxWhere(userId: number): Prisma.TransactionWhereInput {
    return {
      OR: [
        {
          latestForward: {
            receiverId: userId,
          },
        },
        {
          forwards: {
            some: {
              senderId: userId,
              senderSeen: false,
            },
          },
        },
      ],
    };
  }

  private getOutgoingWhere(userId: number): Prisma.TransactionWhereInput {
    return {
      OR: [
        {
          forwards: {
            some: {
              senderId: userId,
              status: TransactionForwardStatus.WAITING,
            },
          },
        },
        {
          latestForward: null,
          creatorId: userId,
        },
      ],
    };
  }

  private getArchiveWhere(userId: number): Prisma.TransactionWhereInput {
    return {
      AND: [
        this.getParticipantWhere(userId),
        {
          NOT: {
            OR: [this.getInboxWhere(userId), this.getOutgoingWhere(userId)],
          },
        },
      ],
    };
  }

  async create(
    creatorId: number,
    role: UserRole,
    createTransactionDto: CreateTransactionDto,
  ) {
    const transaction = await this.prisma.transaction.create({
      data: {
        title: createTransactionDto.title,
        description: createTransactionDto.description,
        typeName: createTransactionDto.typeName,
        priority: createTransactionDto.priority ?? TransactionPriority.LOW,
        creatorId,
        documents: {
          create: (createTransactionDto.documentsIds || []).map((docId) => ({
            documentId: docId,
            attachedBy: creatorId,
          })),
        },
      },
      include: TRANSACTION_INCLUDE,
    });

    return this.mapToTransaction(transaction, role);
  }

  async findAll(userId: number, role: UserRole, queryDto: TransactionQueryDto) {
    const { skip, take, page, perPage } = createPaginator(queryDto);

    let where: Prisma.TransactionWhereInput = {};

    const {
      query,
      title,
      description,
      typeName,
      fulfilled,
      priority,
      creatorId,
      lastForwardStatus,
      from,
      to,
    } = queryDto;

    switch (query) {
      case TransactionQuery.ALL:
        break;
      case TransactionQuery.INBOX:
        where = this.getInboxWhere(userId);
        break;
      case TransactionQuery.OUTGOING:
        where = this.getOutgoingWhere(userId);
        break;
      default:
        where = this.getArchiveWhere(userId);
    }

    if (title) where.title = { contains: title, mode: 'insensitive' };
    if (description)
      where.description = { contains: description, mode: 'insensitive' };
    if (typeName) where.typeName = { contains: typeName, mode: 'insensitive' };
    if (fulfilled !== undefined) where.fulfilled = fulfilled;
    if (priority) where.priority = priority;
    if (creatorId) where.creatorId = creatorId;
    if (lastForwardStatus) where.latestForward = { status: lastForwardStatus };

    if (from || to) {
      where.createdAt = {};
      if (from) where.createdAt.gte = from;
      if (to) where.createdAt.lte = to;
    }

    const [transactions, total, ...statusCounts] =
      await this.prisma.$transaction([
        this.prisma.transaction.findMany({
          where,
          skip,
          take,
          select: {
            id: true,
            title: true,
            typeName: true,
            fulfilled: true,
            priority: true,
            createdAt: true,
            latestForward: {
              select: { status: true },
            },
            _count: {
              select: { documents: true },
            },
          },
          orderBy: { createdAt: 'desc' },
        }),
        this.prisma.transaction.count({ where }),
        ...Object.values(TransactionForwardStatus).map((status) =>
          this.prisma.transaction.count({
            where: {
              ...where,
              latestForward: { status },
            },
          }),
        ),
      ]);

    const summary = Object.values(TransactionForwardStatus).reduce(
      (acc, status, index) => {
        acc[status] = statusCounts[index];
        return acc;
      },
      {} as Record<TransactionForwardStatus, number>,
    );

    const transactionsPaginated = createPaginatedResult(
      transactions.map((t) =>
        instanceToPlain(
          plainToInstance(
            TransactionSummary,
            {
              ...t,
              documentsCount: t._count.documents,
              lastForwardStatus: t.latestForward?.status,
              latestForward: undefined,
              _count: undefined,
            },
            { groups: [role] },
          ),
          { groups: [role] },
        ),
      ),
      total,
      page,
      perPage,
    );

    return {
      ...transactionsPaginated,
      summary,
    };
  }

  async findOne(id: number, role: UserRole) {
    const transaction = await this.prisma.transaction.findUniqueOrThrow({
      where: { id },
      include: TRANSACTION_INCLUDE,
    });

    return this.mapToTransaction(transaction, role);
  }

  async isCreator(id: number, userId: number) {
    const transaction = await this.prisma.transaction.findUnique({
      where: { id },
      select: { creatorId: true },
    });
    return userId == transaction?.creatorId;
  }

  async isParticipant(id: number, userId: number) {
    const transaction = await this.prisma.transaction.findFirst({
      where: {
        id,
        ...this.getParticipantWhere(userId),
      },
      select: { id: true },
    });

    return transaction !== null;
  }

  async isAttacher(transactionId: number, documentId: number, userId: number) {
    const attachment = await this.prisma.transactionDocument.findUnique({
      where: {
        transactionId_documentId: {
          transactionId,
          documentId,
        },
      },
      select: { attachedBy: true },
    });

    return attachment?.attachedBy === userId;
  }

  async findLatestForward(id: number) {
    const transaction = await this.prisma.transaction.findUnique({
      where: { id },
      select: {
        forwards: {
          orderBy: { id: 'desc' },
          take: 1,
        },
      },
    });

    return transaction?.forwards[0];
  }

  async markAsSeen(transactionId: number, userId: number) {
    const now = new Date();
    await Promise.all([
      this.prisma.transactionForward.updateMany({
        where: { transactionId, senderId: userId },
        data: { senderSeen: true, senderSeenAt: now },
      }),
      this.prisma.transactionForward.updateMany({
        where: { transactionId, receiverId: userId },
        data: { receiverSeen: true, receiverSeenAt: now },
      }),
    ]);
  }

  async update(
    id: number,
    userId: number,
    role: UserRole,
    updateTransactionDto: UpdateTransactionDto,
  ) {
    if (updateTransactionDto.fulfilled !== false)
      await this.checkIfFulfilled(id);

    if (updateTransactionDto.fulfilled) {
      const latestForward = await this.findLatestForward(id);

      if (role === UserRole.ACCOUNTANT && latestForward?.receiverId !== userId)
        throw new ApiException(
          HttpStatus.FORBIDDEN,
          ErrorCode.NOT_LATEST_ACCOUNTANT,
          { transactionId: String(id) },
        );

      if (latestForward?.status !== TransactionForwardStatus.APPROVED)
        throw new ApiException(
          HttpStatus.FORBIDDEN,
          ErrorCode.TRANSACTION_NOT_APPROVED,
          { transactionId: String(id) },
        );

      const preTransaction = await this.prisma.transaction.findUniqueOrThrow({
        where: { id },
        select: { budgetName: true, budgetAllocation: true },
      });

      const budgetName =
        updateTransactionDto.budgetName ?? preTransaction.budgetName;
      const budgetAllocation =
        updateTransactionDto.budgetAllocation ??
        preTransaction.budgetAllocation;

      if (budgetName && budgetAllocation) {
        const details = await this.prisma.budgetCategoryDetails.findUnique({
          where: { budgetName },
          select: { available: true },
        });

        if (details && budgetAllocation > details.available) {
          const admins = await this.prisma.user.findMany({
            where: { role: UserRole.ADMIN },
            select: { id: true },
          });

          await Promise.all(
            admins.map((admin) =>
              this.notificationService.create(
                admin.id,
                NotificationType.WARNING,
                NotificationCode.BUDGET_ALLOCATION_OVERFLOW_ATTEMPT,
                {
                  transactionId: String(id),
                  categoryName: budgetName,
                  availableAmount: String(details.available),
                  requestedAmount: String(budgetAllocation),
                  attemptedBy: String(userId),
                },
              ),
            ),
          );

          throw new ApiException(
            HttpStatus.FORBIDDEN,
            ErrorCode.INSUFFICIENT_BUDGET,
            {
              categoryName: budgetName,
              availableAmount: String(details.available),
              requestedAmount: String(budgetAllocation),
            },
          );
        }
      }
    }

    const transaction = await this.prisma.transaction.update({
      where: { id },
      data: updateTransactionDto,
      include: TRANSACTION_INCLUDE,
    });

    return this.mapToTransaction(transaction, role);
  }

  async remove(id: number, role: UserRole) {
    await this.checkIfFulfilled(id);
    const transaction = await this.prisma.transaction.delete({
      where: { id },
      include: TRANSACTION_INCLUDE,
    });

    return this.mapToTransaction(transaction, role);
  }

  async attachDocument(
    transactionId: number,
    documentId: number,
    userId: number,
    role: UserRole,
  ) {
    await this.checkIfFulfilled(transactionId);
    await this.prisma.transactionDocument.upsert({
      where: {
        transactionId_documentId: {
          transactionId,
          documentId,
        },
      },
      create: {
        transactionId,
        documentId,
        attachedBy: userId,
      },
      update: {},
    });

    return this.findOne(transactionId, role);
  }

  async detachDocument(
    transactionId: number,
    documentId: number,
    role: UserRole,
  ) {
    await this.checkIfFulfilled(transactionId);
    await this.prisma.transactionDocument.deleteMany({
      where: {
        transactionId,
        documentId,
      },
    });

    return this.findOne(transactionId, role);
  }

  private mapToTransaction(
    transaction: TransactionWithDocuments,
    role: UserRole,
  ) {
    const result = {
      ...transaction,
      documents: transaction.documents.map((td) =>
        instanceToPlain(
          plainToInstance(
            Document,
            {
              ...td.document,
              downloadURI: getDownloadURI(td.document.id),
            },
            { groups: [role] },
          ),
          { groups: [role] },
        ),
      ),
      lastForwardStatus: transaction.latestForward?.status,
      latestForward: undefined,
    };

    return instanceToPlain(
      plainToInstance(Transaction, result, { groups: [role] }),
      { groups: [role] },
    );
  }

  private async checkIfFulfilled(id: number) {
    const transaction = await this.prisma.transaction.findUnique({
      where: { id },
      select: { fulfilled: true },
    });

    if (transaction?.fulfilled)
      throw new ApiException(
        HttpStatus.FORBIDDEN,
        ErrorCode.TRANSACTION_ALREADY_FULFILLED,
        { transactionId: String(id) },
      );
  }
}

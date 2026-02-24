import { Injectable } from '@nestjs/common';
import { CreateTransactionDto } from './dto/create-transaction.dto.js';
import { UpdateTransactionDto } from './dto/update-transaction.dto.js';
import { Transaction } from './entities/transaction.entity.js';
import { TransactionSummary } from './entities/transaction-summary.entity.js';
import {
  TransactionPriority,
  TransactionForwardStatus,
} from '../../prisma/generated/enums.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { plainToInstance } from 'class-transformer';
import { Document } from '../document/entities/document.entity.js';
import { getDownloadURI } from '../common/utils/document.util.js';
import { TransactionQuery } from './enums/transaction-query.enum.js';
import { Prisma } from '../../prisma/generated/client.js';

import { TransactionQueryDto } from './dto/transaction-query.dto.js';
import {
  createPaginatedResult,
  createPaginator,
} from '../common/utils/pagination.util.js';

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
  constructor(private readonly prisma: PrismaService) {}

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

  async create(creatorId: number, createTransactionDto: CreateTransactionDto) {
    const transaction = await this.prisma.transaction.create({
      data: {
        title: createTransactionDto.title,
        description: createTransactionDto.description,
        typeName: createTransactionDto.typeName,
        priority: createTransactionDto.priority ?? TransactionPriority.LOW,
        creatorId,
        documents: {
          create:
            createTransactionDto.documentsIds?.map((docId) => ({
              documentId: docId,
              attachedBy: creatorId,
            })) || [],
        },
      },
      include: TRANSACTION_INCLUDE,
    });

    return this.mapToTransaction(transaction);
  }

  async findAll(userId: number, queryDto: TransactionQueryDto) {
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
    } = queryDto;

    if (query && query !== TransactionQuery.ALL) {
      if (query === TransactionQuery.INBOX) {
        where = this.getInboxWhere(userId);
      } else if (query === TransactionQuery.OUTGOING) {
        where = this.getOutgoingWhere(userId);
      } else {
        where.NOT = {
          OR: [this.getInboxWhere(userId), this.getOutgoingWhere(userId)],
        };
      }
    } else if (!query) {
      // Default behavior if query is absent: 'archive'
      where.NOT = {
        OR: [this.getInboxWhere(userId), this.getOutgoingWhere(userId)],
      };
    }

    if (title) where.title = { contains: title, mode: 'insensitive' };
    if (description)
      where.description = { contains: description, mode: 'insensitive' };
    if (typeName) where.typeName = { contains: typeName, mode: 'insensitive' };
    if (fulfilled !== undefined) where.fulfilled = fulfilled;
    if (priority) where.priority = priority;
    if (creatorId) where.creatorId = creatorId;
    if (lastForwardStatus) where.latestForward = { status: lastForwardStatus };

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
        plainToInstance(TransactionSummary, {
          ...t,
          documentsCount: t._count.documents,
          lastForwardStatus: t.latestForward?.status,
          latestForward: undefined,
          _count: undefined,
        }),
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

  async findOne(id: number) {
    const transaction = await this.prisma.transaction.findUniqueOrThrow({
      where: { id },
      include: TRANSACTION_INCLUDE,
    });

    return this.mapToTransaction(transaction);
  }

  async isCreator(id: number, userId: number) {
    const transaction = await this.prisma.transaction.findUnique({
      where: { id },
      select: { creatorId: true },
    });
    return userId == transaction?.creatorId;
  }

  async isParticipant(id: number, userId: number) {
    const transaction = await this.prisma.transaction.findUnique({
      where: { id },
      select: {
        creatorId: true,
        latestForward: {
          select: {
            senderId: true,
            receiverId: true,
          },
        },
      },
    });

    if (!transaction) return false;

    return (
      transaction.creatorId === userId ||
      transaction.latestForward?.senderId === userId ||
      transaction.latestForward?.receiverId === userId
    );
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
    await Promise.all([
      this.prisma.transactionForward.updateMany({
        where: { transactionId, senderId: userId },
        data: { senderSeen: true },
      }),
      this.prisma.transactionForward.updateMany({
        where: { transactionId, receiverId: userId },
        data: { receiverSeen: true },
      }),
    ]);
  }

  async update(id: number, updateTransactionDto: UpdateTransactionDto) {
    const transaction = await this.prisma.transaction.update({
      where: { id },
      data: updateTransactionDto,
      include: TRANSACTION_INCLUDE,
    });

    return this.mapToTransaction(transaction);
  }

  async remove(id: number) {
    const transaction = await this.prisma.transaction.delete({
      where: { id },
      include: TRANSACTION_INCLUDE,
    });

    return this.mapToTransaction(transaction);
  }

  async attachDocument(
    transactionId: number,
    documentId: number,
    userId: number,
  ) {
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

    return this.findOne(transactionId);
  }

  async detachDocument(transactionId: number, documentId: number) {
    await this.prisma.transactionDocument.deleteMany({
      where: {
        transactionId,
        documentId,
      },
    });

    return this.findOne(transactionId);
  }

  private mapToTransaction(transaction: TransactionWithDocuments) {
    const result = {
      ...transaction,
      documents: transaction.documents.map((td) =>
        plainToInstance(Document, {
          ...td.document,
          downloadURI: getDownloadURI(td.document.id),
        }),
      ),
      lastForwardStatus: transaction.latestForward?.status,
      latestForward: undefined,
    };

    return plainToInstance(Transaction, result);
  }
}

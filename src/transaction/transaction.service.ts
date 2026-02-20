import { Injectable } from '@nestjs/common';
import { CreateTransactionDto } from './dto/create-transaction.dto.js';
import { UpdateTransactionDto } from './dto/update-transaction.dto.js';
import { Transaction } from './entities/transaction.entity.js';
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
import { PaginationDto } from '../common/dto/pagination.dto.js';
import {
  createPaginatedResult,
  createPaginator,
} from '../common/utils/pagination.util.js';

type TransactionWithDocuments = Prisma.TransactionGetPayload<{
  include: {
    documents: {
      include: {
        document: true;
      };
    };
    latestForward: {
      select: {
        status: true;
      };
    };
  };
}>;

@Injectable()
export class TransactionService {
  constructor(private readonly prisma: PrismaService) {}

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
      include: {
        documents: {
          include: {
            document: true,
          },
        },
        latestForward: {
          select: { status: true },
        },
      },
    });

    return this.mapToTransaction(transaction);
  }

  async findAll(
    userId: number,
    paginationDto: PaginationDto,
    query?: TransactionQuery,
  ) {
    const { skip, take, page, perPage } = createPaginator(paginationDto);

    const where: Prisma.TransactionWhereInput = {};

    if (query !== TransactionQuery.ALL) {
      if (query === TransactionQuery.INBOX) {
        where.OR = [
          {
            latestForward: {
              receiverId: userId,
            },
          },
          {
            latestForward: null,
            creatorId: userId,
          },
        ];
      } else if (query === TransactionQuery.OUTGOING) {
        where.latestForward = {
          senderId: userId,
        };
      } else {
        where.OR = [
          {
            creatorId: userId,
            latestForward: {
              senderId: { not: userId },
              receiverId: { not: userId },
            },
          },
          {
            forwards: {
              some: {
                OR: [{ senderId: userId }, { receiverId: userId }],
              },
            },
          },
        ];
      }
    }

    const [transactions, total, ...statusCounts] =
      await this.prisma.$transaction([
        this.prisma.transaction.findMany({
          where,
          skip,
          take,
          include: {
            documents: {
              include: {
                document: true,
              },
            },
            latestForward: {
              select: { status: true },
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
        this.mapToTransaction(t as TransactionWithDocuments),
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
      include: {
        documents: {
          include: {
            document: true,
          },
        },
        latestForward: {
          select: { status: true },
        },
      },
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
    const latestForward = await this.findLatestForward(transactionId);
    if (!latestForward) return;

    if (
      latestForward.senderId === userId &&
      latestForward.senderSeen === false
    ) {
      await this.prisma.transactionForward.update({
        where: { id: latestForward.id },
        data: { senderSeen: true },
      });
    } else if (
      latestForward.receiverId === userId &&
      latestForward.receiverSeen === false
    ) {
      await this.prisma.transactionForward.update({
        where: { id: latestForward.id },
        data: { receiverSeen: true },
      });
    }
  }

  async update(id: number, updateTransactionDto: UpdateTransactionDto) {
    const transaction = await this.prisma.transaction.update({
      where: { id },
      data: updateTransactionDto,
      include: {
        documents: {
          include: {
            document: true,
          },
        },
        latestForward: {
          select: { status: true },
        },
      },
    });

    return this.mapToTransaction(transaction);
  }

  async remove(id: number) {
    const transaction = await this.prisma.transaction.delete({
      where: { id },
      include: {
        documents: {
          include: {
            document: true,
          },
        },
        latestForward: {
          select: { status: true },
        },
      },
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

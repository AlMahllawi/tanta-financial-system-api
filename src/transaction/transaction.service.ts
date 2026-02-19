import { Injectable } from '@nestjs/common';
import { CreateTransactionDto } from './dto/create-transaction.dto.js';
import { UpdateTransactionDto } from './dto/update-transaction.dto.js';
import { Transaction } from './entities/transaction.entity.js';
import { TransactionPriority } from '../../prisma/generated/enums.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { plainToInstance } from 'class-transformer';
import { Document } from '../document/entities/document.entity.js';
import { getDownloadURI } from '../common/utils/document.util.js';
import { TransactionQuery } from './enums/transaction-query.enum.js';
import { Prisma } from '../../prisma/generated/client.js';

type TransactionWithDocuments = Prisma.TransactionGetPayload<{
  include: {
    documents: {
      include: {
        document: true;
      };
    };
    forwards: {
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
        forwards: {
          orderBy: { id: 'desc' },
          take: 1,
          select: { status: true },
        },
      },
    });

    return this.mapToTransaction(transaction);
  }

  async findAll(userId: number, query?: TransactionQuery) {
    if (query === TransactionQuery.ALL) {
      const transactions = await this.prisma.transaction.findMany({
        include: {
          documents: {
            include: {
              document: true,
            },
          },
          forwards: {
            orderBy: { id: 'desc' },
            take: 1,
            select: { status: true },
          },
        },
      });
      return transactions.map((t) => this.mapToTransaction(t));
    }

    const where: Prisma.TransactionWhereInput = {};
    const userViewedLatestForward: Prisma.TransactionForwardFindManyArgs = {
      orderBy: { id: 'desc' },
      take: 1,
      select: { status: true },
    };

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
      userViewedLatestForward.where = {
        OR: [{ senderId: userId }, { receiverId: userId }],
      };
    }

    const transactions = await this.prisma.transaction.findMany({
      where,
      include: {
        documents: {
          include: {
            document: true,
          },
        },
        forwards: userViewedLatestForward,
      },
      orderBy: { createdAt: 'desc' },
    });

    return transactions.map((t) =>
      this.mapToTransaction(t as TransactionWithDocuments),
    );
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
        forwards: {
          orderBy: { id: 'desc' },
          take: 1,
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
        forwards: {
          orderBy: { id: 'desc' },
          take: 1,
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
        forwards: {
          orderBy: { id: 'desc' },
          take: 1,
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
      lastForwardStatus: transaction.forwards?.[0]?.status,
      forwards: undefined,
    };

    return plainToInstance(Transaction, result);
  }
}

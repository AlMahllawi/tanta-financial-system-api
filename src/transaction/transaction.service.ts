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

    // TODO: Handover Logic, replace raw query
    const rawQuery = Prisma.sql`
      SELECT t.id
      FROM "Transaction" t
      LEFT JOIN LATERAL (
        SELECT * FROM "TransactionForward" tf
        WHERE tf."transactionId" = t.id
        ORDER BY tf.id DESC
        LIMIT 1
      ) latest_tf ON true
      WHERE 
        CASE 
          WHEN ${query === TransactionQuery.INBOX} THEN 
            (latest_tf.id IS NOT NULL AND latest_tf."receiverId" = ${userId}) OR 
            (latest_tf.id IS NULL AND t."creatorId" = ${userId})
            
          WHEN ${query === TransactionQuery.OUTGOING} THEN 
            (latest_tf.id IS NOT NULL AND latest_tf."senderId" = ${userId})

          ELSE 
            (
              latest_tf.id IS NOT NULL 
              AND 
              latest_tf."senderId" != ${userId} 
              AND 
              latest_tf."receiverId" != ${userId}
              AND
              (
                t."creatorId" = ${userId}
                OR
                EXISTS (
                  SELECT 1 FROM "TransactionForward" tf 
                  WHERE tf."transactionId" = t.id 
                  AND (tf."senderId" = ${userId} OR tf."receiverId" = ${userId})
                )
              )
            )
        END
    `;

    return await this.prisma.$transaction(async (tx) => {
      const resultIds = await tx.$queryRaw<{ id: number }[]>(rawQuery);
      const ids = resultIds.map((r) => r.id);

      const useGlobalLatest =
        query === TransactionQuery.INBOX ||
        query === TransactionQuery.OUTGOING ||
        query === TransactionQuery.ALL;

      // TODO: retrieve in one query
      const transactions = await tx.transaction.findMany({
        where: {
          id: { in: ids },
        },
        include: {
          documents: {
            include: { document: true },
          },
          forwards: {
            where: useGlobalLatest
              ? undefined
              : { OR: [{ senderId: userId }, { receiverId: userId }] },
            orderBy: { id: 'desc' },
            take: 1,
            select: { status: true },
          },
        },
        orderBy: { createdAt: 'desc' },
      });

      return transactions.map((t) =>
        this.mapToTransaction(t as unknown as TransactionWithDocuments),
      );
    });
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
    };

    return plainToInstance(Transaction, result);
  }
}

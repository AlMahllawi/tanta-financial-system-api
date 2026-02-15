import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateTransactionDto } from './dto/create-transaction.dto.js';
import { UpdateTransactionDto } from './dto/update-transaction.dto.js';
import { Transaction } from './entities/transaction.entity.js';
import { TransactionPriority } from '../../prisma/generated/enums.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { Prisma } from '../../prisma/generated/client.js';
import { plainToInstance } from 'class-transformer';
import { ErrorCode } from '../common/enums/error-codes.enum.js';
import { Document } from '../document/entities/document.entity.js';
import { getDownloadURI } from '../common/utils/document.util.js';

@Injectable()
export class TransactionService {
  constructor(private readonly prisma: PrismaService) {}

  async create(creatorId: number, createTransactionDto: CreateTransactionDto) {
    try {
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
        },
      });

      const result = {
        ...transaction,
        documents: transaction.documents.map((td) =>
          plainToInstance(Document, {
            ...td.document,
            downloadURI: getDownloadURI(td.document.id),
          }),
        ),
      };

      return plainToInstance(Transaction, result);
    } catch (error) {
      if (!(error instanceof Prisma.PrismaClientKnownRequestError)) throw error;
      if (
        error.code === 'P2003' &&
        (error.meta?.field_name as string).includes('typeName')
      )
        throw new NotFoundException({
          message: {
            key: ErrorCode.TRANSACTION_TYPE_FK_NOT_FOUND,
            args: { typeName: createTransactionDto.typeName },
          },
          statusCode: 404,
          error: 'Not Found',
        });
      if (
        error.code === 'P2003' &&
        (error.meta?.field_name as string).includes('creatorId')
      )
        throw new NotFoundException({
          message: {
            key: ErrorCode.TRANSACTION_CREATOR_NOT_FOUND,
            args: { creatorId },
          },
          statusCode: 404,
          error: 'Not Found',
        });
      if (
        error.code === 'P2003' &&
        JSON.stringify(error.meta).includes('TransactionDocument')
      ) {
        const idsToCheck = createTransactionDto.documentsIds || [];
        if (idsToCheck.length > 0) {
          const validDocuments = await this.prisma.document.findMany({
            where: {
              id: { in: idsToCheck },
            },
            select: { id: true },
          });

          const validIds = new Set(validDocuments.map((d) => d.id));
          const invalidIds = idsToCheck.filter((id) => !validIds.has(id));

          if (invalidIds.length > 0) {
            throw new NotFoundException({
              message: {
                key: ErrorCode.DOCUMENT_NOT_FOUND,
                args: { id: invalidIds.join(', ') },
              },
              statusCode: 404,
              error: 'Not Found',
            });
          }
        }
      }
      throw error;
    }
  }

  // TODO: paginate, query parameters
  async findAll() {
    const transactions = await this.prisma.transaction.findMany({
      include: {
        documents: {
          include: {
            document: true,
          },
        },
      },
    });

    const result = transactions.map((transaction) => ({
      ...transaction,
      documents: transaction.documents.map((td) =>
        plainToInstance(Document, {
          ...td.document,
          downloadURI: getDownloadURI(td.document.id),
        }),
      ),
    }));

    return plainToInstance(Transaction, result);
  }

  async findOne(id: number) {
    const transaction = await this.prisma.transaction.findUnique({
      where: { id },
      include: {
        documents: {
          include: {
            document: true,
          },
        },
      },
    });

    if (!transaction)
      throw new NotFoundException({
        message: { key: ErrorCode.TRANSACTION_NOT_FOUND, args: { id } },
        statusCode: 404,
        error: 'Not Found',
      });

    const result = {
      ...transaction,
      documents: transaction.documents.map((td) =>
        plainToInstance(Document, {
          ...td.document,
          downloadURI: getDownloadURI(td.document.id),
        }),
      ),
    };

    return plainToInstance(Transaction, result);
  }

  async update(id: number, updateTransactionDto: UpdateTransactionDto) {
    try {
      const transaction = await this.prisma.transaction.update({
        where: { id },
        data: updateTransactionDto,
        include: {
          documents: {
            include: {
              document: true,
            },
          },
        },
      });

      const result = {
        ...transaction,
        documents: transaction.documents.map((td) =>
          plainToInstance(Document, {
            ...td.document,
            downloadURI: getDownloadURI(td.document.id),
          }),
        ),
      };

      return plainToInstance(Transaction, result);
    } catch (error) {
      if (!(error instanceof Prisma.PrismaClientKnownRequestError)) throw error;
      if (error.code === 'P2025')
        throw new NotFoundException({
          message: { key: ErrorCode.TRANSACTION_NOT_FOUND, args: { id } },
          statusCode: 404,
          error: 'Not Found',
        });
      if (
        error.code === 'P2003' &&
        (error.meta?.field_name as string).includes('typeName')
      )
        throw new NotFoundException({
          message: {
            key: ErrorCode.TRANSACTION_TYPE_FK_NOT_FOUND,
            args: { typeName: updateTransactionDto.typeName },
          },
          statusCode: 404,
          error: 'Not Found',
        });
      throw error;
    }
  }

  async remove(id: number) {
    try {
      const transaction = await this.prisma.transaction.delete({
        where: { id },
        include: {
          documents: {
            include: {
              document: true,
            },
          },
        },
      });

      const result = {
        ...transaction,
        documents: transaction.documents.map((td) =>
          plainToInstance(Document, {
            ...td.document,
            downloadURI: getDownloadURI(td.document.id),
          }),
        ),
      };

      return plainToInstance(Transaction, result);
    } catch (error) {
      if (!(error instanceof Prisma.PrismaClientKnownRequestError)) throw error;
      if (error.code === 'P2025')
        throw new NotFoundException({
          message: { key: ErrorCode.TRANSACTION_NOT_FOUND, args: { id } },
          statusCode: 404,
          error: 'Not Found',
        });
      throw error;
    }
  }

  async attachDocument(
    transactionId: number,
    documentId: number,
    userId: number,
  ) {
    try {
      await this.prisma.transactionDocument.create({
        data: {
          transactionId,
          documentId,
          attachedBy: userId,
        },
      });

      return this.findOne(transactionId);
    } catch (error) {
      if (!(error instanceof Prisma.PrismaClientKnownRequestError)) throw error;
      if (
        error.code === 'P2003' &&
        JSON.stringify(error.meta).includes('transactionId')
      )
        throw new NotFoundException({
          message: {
            key: ErrorCode.TRANSACTION_NOT_FOUND,
            args: { id: transactionId },
          },
          statusCode: 404,
          error: 'Not Found',
        });
      if (
        error.code === 'P2003' &&
        JSON.stringify(error.meta).includes('documentId')
      )
        throw new NotFoundException({
          message: {
            key: ErrorCode.DOCUMENT_NOT_FOUND,
            args: { id: documentId },
          },
          statusCode: 404,
          error: 'Not Found',
        });
      // Ignore unique constraint violation (already attached)
      if (error.code === 'P2002') return this.findOne(transactionId);
      throw error;
    }
  }

  async detachDocument(transactionId: number, documentId: number) {
    try {
      await this.prisma.transactionDocument.delete({
        where: {
          transactionId_documentId: {
            transactionId,
            documentId,
          },
        },
      });

      return this.findOne(transactionId);
    } catch (error) {
      if (!(error instanceof Prisma.PrismaClientKnownRequestError)) throw error;
      // If the relationship doesn't exist, we can consider it detached and return the transaction
      if (error.code === 'P2025') return this.findOne(transactionId);
      throw error;
    }
  }
}

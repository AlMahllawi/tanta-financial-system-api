import { Injectable, NotFoundException } from '@nestjs/common';
import { Document } from './entities/document.entity.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { Prisma } from '../../prisma/generated/client.js';
import { plainToInstance } from 'class-transformer';
import { ErrorCode } from '../common/enums/error-codes.enum.js';

@Injectable()
export class DocumentService {
  constructor(private readonly prisma: PrismaService) {}

  async create(uploaderId: number, file: Express.Multer.File) {
    try {
      const document = await this.prisma.document.create({
        data: {
          title: file.originalname,
          content: Buffer.from(file.buffer),
          uploaderId,
        },
      });

      return plainToInstance(Document, {
        ...document,
        downloadURI: `/documents/${document.id}/download`,
      });
    } catch (error) {
      if (!(error instanceof Prisma.PrismaClientKnownRequestError)) throw error;
      if (
        error.code === 'P2003' &&
        (error.meta?.field_name as string).includes('uploaderId')
      )
        throw new NotFoundException({
          message: {
            key: ErrorCode.DOCUMENT_UPLOADER_NOT_FOUND,
            args: { uploaderId },
          },
          statusCode: 404,
          error: 'Not Found',
        });
      throw error;
    }
  }

  // TODO: paginate, filters
  async findAll(uploaderId: number) {
    const documents = await this.prisma.document.findMany({
      where: { uploaderId },
    });

    return plainToInstance(
      Document,
      documents.map((doc) => ({
        ...doc,
        downloadURI: `/documents/${doc.id}/download`,
      })),
    );
  }

  async findOne(id: number) {
    const document = await this.prisma.document.findUnique({
      where: { id },
    });

    if (!document)
      throw new NotFoundException({
        message: { key: ErrorCode.DOCUMENT_NOT_FOUND, args: { id } },
        statusCode: 404,
        error: 'Not Found',
      });

    return plainToInstance(Document, {
      ...document,
      downloadURI: `/documents/${document.id}/download`,
    });
  }

  async remove(id: number) {
    try {
      const document = await this.prisma.document.delete({
        where: { id },
      });

      return plainToInstance(Document, {
        ...document,
        downloadURI: `/documents/${document.id}/download`,
      });
    } catch (error) {
      if (!(error instanceof Prisma.PrismaClientKnownRequestError)) throw error;
      if (error.code === 'P2025')
        throw new NotFoundException({
          message: { key: ErrorCode.DOCUMENT_NOT_FOUND, args: { id } },
          statusCode: 404,
          error: 'Not Found',
        });
      throw error;
    }
  }
}

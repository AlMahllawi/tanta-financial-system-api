import { HttpStatus, Injectable } from '@nestjs/common';
import { plainToInstance } from 'class-transformer';

import { UserRole } from '../../prisma/generated/enums.js';
import { PaginationDto } from '../common/dto/pagination.dto.js';
import { ErrorCode } from '../common/enums/error-codes.enum.js';
import { ApiException } from '../common/exceptions/api.exception.js';
import { getDownloadURI } from '../common/utils/document.util.js';
import {
  createPaginatedResult,
  createPaginator,
} from '../common/utils/pagination.util.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { Document } from './entities/document.entity.js';

@Injectable()
export class DocumentService {
  constructor(private readonly prisma: PrismaService) {}

  async create(uploaderId: number, file: Express.Multer.File) {
    const document = await this.prisma.document.create({
      data: {
        title: file.originalname,
        content: Buffer.from(file.buffer),
        uploaderId,
      },
    });

    return plainToInstance(Document, {
      ...document,
      downloadURI: getDownloadURI(document.id),
    });
  }

  async findAll(uploaderId: number, paginationDto: PaginationDto) {
    const { skip, take, page, perPage } = createPaginator(paginationDto);

    const [documents, total] = await this.prisma.$transaction([
      this.prisma.document.findMany({
        where: { uploaderId },
        skip,
        take,
      }),
      this.prisma.document.count({
        where: { uploaderId },
      }),
    ]);

    return createPaginatedResult(
      plainToInstance(
        Document,
        documents.map((doc) => ({
          ...doc,
          downloadURI: getDownloadURI(doc.id),
        })),
      ),
      total,
      page,
      perPage,
    );
  }

  async isVisibleToUser(id: number, userId: number) {
    const document = await this.prisma.document.findFirst({
      where: {
        id,
        OR: [
          { uploaderId: userId },
          {
            transactions: {
              some: {
                transaction: {
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
                },
              },
            },
          },
        ],
      },
      select: { id: true },
    });

    return document !== null;
  }

  async findOneWithContent(id: number) {
    return this.prisma.document.findUniqueOrThrow({
      where: { id },
    });
  }

  async findOne(id: number) {
    const document = await this.prisma.document.findUniqueOrThrow({
      where: { id },
    });

    return plainToInstance(Document, {
      ...document,
      downloadURI: getDownloadURI(document.id),
    });
  }

  async remove(id: number, userId: number, role: UserRole) {
    const document = await this.prisma.document.findUniqueOrThrow({
      where: { id },
    });

    if (role !== UserRole.ADMIN && document.uploaderId !== userId)
      throw new ApiException(
        HttpStatus.FORBIDDEN,
        ErrorCode.NOT_DOCUMENT_UPLOADER,
        { documentId: String(id) },
      );

    await this.prisma.document.delete({
      where: { id },
    });

    return plainToInstance(Document, {
      ...document,
      downloadURI: getDownloadURI(document.id),
    });
  }
}

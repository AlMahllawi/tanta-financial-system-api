import { Injectable } from '@nestjs/common';
import { Document } from './entities/document.entity.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { plainToInstance } from 'class-transformer';
import { getDownloadURI } from '../common/utils/document.util.js';

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

  // TODO: paginate, filters
  async findAll(uploaderId: number) {
    const documents = await this.prisma.document.findMany({
      where: { uploaderId },
    });

    return plainToInstance(
      Document,
      documents.map((doc) => ({
        ...doc,
        downloadURI: getDownloadURI(doc.id),
      })),
    );
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

  async remove(id: number) {
    const document = await this.prisma.document.delete({
      where: { id },
    });

    return plainToInstance(Document, {
      ...document,
      downloadURI: getDownloadURI(document.id),
    });
  }
}

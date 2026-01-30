import { Injectable } from '@nestjs/common';
import { Document } from './entities/document.entity';

const document = new Document();
document.title = 'Transaction.pdf';
document.uploader = 'AlMahllawi';
document.uploadedAt = new Date();

@Injectable()
export class DocumentService {
  create(file: Express.Multer.File) {
    document.title = file.originalname;
    return document;
  }

  findAll() {
    return [document];
  }

  findOne(id: number) {
    document.id = id;
    return document;
  }

  remove(id: number) {
    document.id = id;
    return document;
  }
}

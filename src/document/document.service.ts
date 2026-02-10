import { Injectable } from '@nestjs/common';
import { Document } from './entities/document.entity';
import { instanceToInstance } from 'class-transformer';

const dummyDocument = new Document();
dummyDocument.id = 1;
dummyDocument.title = 'Transaction.txt';
dummyDocument.content = new Uint8Array(Buffer.from('Dummy Text Content'));
dummyDocument.uploaderName = 'AlMahllawi';
dummyDocument.uploadedAt = new Date();

@Injectable()
export class DocumentService {
  create(file: Express.Multer.File) {
    ++dummyDocument.id;
    dummyDocument.title = file.originalname;
    dummyDocument.content = new Uint8Array(file.buffer);
    dummyDocument.uploaderName = 'AlMahllawi';
    dummyDocument.uploadedAt = new Date();
    return dummyDocument;
  }

  findAll() {
    return [dummyDocument];
  }

  findOne(id: number) {
    const document = instanceToInstance(dummyDocument);
    document.content = dummyDocument.content;
    document.id = id;
    document.downloadURI = `/documents/${id}/download`;
    return document;
  }

  remove(id: number) {
    dummyDocument.id = id;
    return dummyDocument;
  }
}

import { Injectable } from '@nestjs/common';

@Injectable()
export class DocumentService {
  create(file: Express.Multer.File) {
    return 'This action adds a new document';
  }

  findAll() {
    return `This action returns all document`;
  }

  findOne(id: number) {
    return `This action returns a #${id} document`;
  }

  remove(id: number) {
    return `This action removes a #${id} document`;
  }
}

import { Exclude } from 'class-transformer';
import { DocumentModel } from 'prisma/generated/models';

export class Document implements DocumentModel {
  id: number;
  title: string;
  @Exclude()
  content: Uint8Array<ArrayBuffer>;
  uploadedAt: Date;
  uploader: string;
}

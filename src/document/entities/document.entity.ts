import { ApiHideProperty } from '@nestjs/swagger';
import { Exclude } from 'class-transformer';
import { DocumentModel } from 'prisma/generated/models';

export class Document implements DocumentModel {
  id: number;
  title: string;
  @Exclude()
  @ApiHideProperty()
  content: Uint8Array<ArrayBuffer>;
  uploadedAt: Date;
  uploaderName: string;
  downloadURI: string; // TODO: replace with downloadURL for separated storage rather than database
}

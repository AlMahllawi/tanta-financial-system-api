import { ApiHideProperty, ApiProperty } from '@nestjs/swagger';
import { Exclude } from 'class-transformer';
import { DocumentModel } from '../../../prisma/generated/models.js';

export class Document implements DocumentModel {
  @ApiProperty()
  id: number;

  @ApiProperty()
  title: string;

  @Exclude()
  @ApiHideProperty()
  content: Uint8Array<ArrayBuffer>;

  @ApiProperty()
  uploadedAt: Date;

  @ApiProperty()
  uploaderName: string;

  @ApiProperty()
  downloadURI: string; // TODO: replace with downloadURL for separated storage rather than database
}

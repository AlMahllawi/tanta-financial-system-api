import {
  Controller,
  Get,
  Post,
  Param,
  Delete,
  UploadedFile,
  ParseFilePipe,
  MaxFileSizeValidator,
  FileTypeValidator,
  UseInterceptors,
  StreamableFile,
  Res,
  NotFoundException,
} from '@nestjs/common';
import type { Response } from 'express';
import { contentType } from 'mime-types';
import { DocumentService } from './document.service';
import {
  ApiBody,
  ApiConsumes,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import { Document } from './entities/document.entity';

@ApiTags('Documents')
@Controller('documents')
export class DocumentController {
  constructor(private readonly documentService: DocumentService) {}

  @Post()
  @ApiOperation({ summary: 'Upload a document' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      required: ['file'],
      properties: {
        file: { type: 'string', format: 'binary' },
      },
    },
  })
  @ApiResponse({ status: 201, type: Document })
  @UseInterceptors(FileInterceptor('file'))
  create(
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({ maxSize: 1024 * 1024 * 5 }),
          new FileTypeValidator({ fileType: 'application/pdf' }),
        ],
        fileIsRequired: true,
      }),
    )
    file: Express.Multer.File,
  ) {
    return this.documentService.create(file);
  }

  @Get('uploaded')
  @ApiOperation({ summary: 'Retrieve all documents uploaded by the user' })
  @ApiResponse({ status: 200, type: [Document] })
  findAll() {
    return this.documentService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Retrieve a document by ID' })
  @ApiResponse({ status: 200, type: Document })
  findOne(@Param('id') id: string) {
    return this.documentService.findOne(+id);
  }

  @Get(':id/download')
  @ApiOperation({ summary: 'Download a document' })
  download(
    @Param('id') id: string,
    @Res({ passthrough: true }) res: Response,
  ): StreamableFile {
    const document = this.documentService.findOne(+id);

    if (!document) {
      throw new NotFoundException('Document not found');
    }

    res.set({
      'Content-Type': contentType(document.title) || 'application/octet-stream',
      'Content-Disposition': `attachment; filename="${document.title}"`,
    });

    return new StreamableFile(Buffer.from(document.content));
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a document by ID' })
  @ApiResponse({ status: 200, type: Document })
  remove(@Param('id') id: string) {
    return this.documentService.remove(+id);
  }
}

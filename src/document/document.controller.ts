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
  HttpStatus,
  UseGuards,
  ParseIntPipe,
} from '@nestjs/common';
import type { Response } from 'express';
import { contentType } from 'mime-types';
import { DocumentService } from './document.service.js';
import {
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import { Document } from './entities/document.entity.js';
import { ErrorCode } from '../common/enums/error-codes.enum.js';
import { ApiResponses } from '../common/decorators/http.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { CurrentUser } from '../common/decorators/current-user.decorator.js';

@ApiTags('Documents')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
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
  @ApiResponses({
    status: HttpStatus.CREATED,
    type: Document,
    description: 'Document uploaded successfully',
  })
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
    @CurrentUser('id') uploaderId: number,
  ) {
    return this.documentService.create(uploaderId, file);
  }

  @Get('uploaded')
  @ApiOperation({ summary: 'Retrieve all documents uploaded by the user' })
  @ApiResponses({
    status: HttpStatus.OK,
    type: [Document],
    description: 'Documents retrieved successfully',
  })
  findAll(@CurrentUser('id') uploaderId: number) {
    return this.documentService.findAll(uploaderId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Retrieve a document by ID' })
  @ApiResponses(
    {
      status: HttpStatus.OK,
      type: Document,
      description: 'Document retrieved successfully',
    },
    {
      status: HttpStatus.NOT_FOUND,
      description: 'No document was found with such id',
      errorCode: ErrorCode.DOCUMENT_NOT_FOUND,
      args: { id: 1 },
    },
  )
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.documentService.findOne(id);
  }

  @Get(':id/download')
  @ApiOperation({ summary: 'Download a document' })
  @ApiResponses(
    {
      status: HttpStatus.OK,
      description: 'Document downloaded successfully',
    },
    {
      status: HttpStatus.NOT_FOUND,
      description: 'No document was found with such id',
      errorCode: ErrorCode.DOCUMENT_NOT_FOUND,
      args: { id: 1 },
    },
  )
  async download(
    @Param('id', ParseIntPipe) id: number,
    @Res({ passthrough: true }) res: Response,
  ): Promise<StreamableFile> {
    const document = await this.documentService.findOne(id);

    res.set({
      'Content-Type': contentType(document.title) || 'application/octet-stream',
      'Content-Disposition': `attachment; filename="${document.title}"`,
    });

    return new StreamableFile(Buffer.from(document.content));
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a document by ID' })
  @ApiResponses(
    {
      status: HttpStatus.OK,
      type: Document,
      description: 'Document deleted successfully',
    },
    {
      status: HttpStatus.NOT_FOUND,
      description: 'No document was found with such id',
      errorCode: ErrorCode.DOCUMENT_NOT_FOUND,
      args: { id: 1 },
    },
  )
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.documentService.remove(id);
  }
}

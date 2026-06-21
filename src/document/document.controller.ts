import 'multer';

import {
  Controller,
  Delete,
  FileTypeValidator,
  Get,
  HttpStatus,
  MaxFileSizeValidator,
  Param,
  ParseFilePipe,
  ParseIntPipe,
  Post,
  Res,
  StreamableFile,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { Query } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import type { Response } from 'express';
import { contentType } from 'mime-types';

import { UserRole } from '../../prisma/generated/enums.js';
import { CurrentUser } from '../auth/decorators/current-user.decorator.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { ApiErrorResponses } from '../common/decorators/api-error.decorator.js';
import { ApiPaginatedResponse } from '../common/decorators/pagination.decorator.js';
import { PaginationDto } from '../common/dto/pagination.dto.js';
import { ErrorCode } from '../common/enums/error-codes.enum.js';
import { ApiException } from '../common/exceptions/api.exception.js';
import { ApiPrismaErrorResponses } from '../prisma/decorators/exception.decorator.js';
import {
  matchDriverAdapter,
  matchRecordsNotFound,
} from '../prisma/prisma.matchers.js';
import { DocumentService } from './document.service.js';
import { Document } from './entities/document.entity.js';

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
  @ApiCreatedResponse({
    type: Document,
    description: 'Document uploaded successfully',
  })
  @UseInterceptors(FileInterceptor('file'))
  create(
    @CurrentUser('id') uploaderId: number,
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({ maxSize: 1024 * 1024 * 10 }),
          new FileTypeValidator({
            fileType:
              /^(application\/pdf|application\/msword|application\/vnd\.openxmlformats-officedocument\.wordprocessingml\.document|application\/vnd\.ms-excel|application\/vnd\.openxmlformats-officedocument\.spreadsheetml\.sheet|application\/vnd\.ms-powerpoint|application\/vnd\.openxmlformats-officedocument\.presentationml\.presentation|text\/plain|image\/jpeg|image\/png|image\/gif|image\/webp|image\/bmp|image\/tiff)$/,
          }),
        ],
        fileIsRequired: true,
      }),
    )
    file: Express.Multer.File,
  ) {
    return this.documentService.create(uploaderId, file);
  }

  @Get('uploaded')
  @ApiOperation({ summary: 'Retrieve all documents uploaded by the user' })
  @ApiPaginatedResponse(Document)
  findAll(
    @CurrentUser('id') uploaderId: number,
    @Query() paginationDto: PaginationDto,
  ) {
    return this.documentService.findAll(uploaderId, paginationDto);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Retrieve a document by ID' })
  @ApiOkResponse({
    type: Document,
    description: 'Document retrieved successfully',
  })
  @ApiPrismaErrorResponses({
    errorCode: ErrorCode.DOCUMENT_NOT_FOUND,
    argExtractor: (params) => ({ documentId: String(params.id) }),
    matchers: matchRecordsNotFound('Document'),
  })
  @ApiErrorResponses(ErrorCode.NOT_DOCUMENT_VIEWER)
  async findOne(
    @CurrentUser('id') userId: number,
    @CurrentUser('role') role: UserRole,
    @Param('id', ParseIntPipe) id: number,
  ) {
    if (
      role !== UserRole.ADMIN &&
      !(await this.documentService.isVisibleToUser(id, userId))
    )
      throw new ApiException(
        HttpStatus.FORBIDDEN,
        ErrorCode.NOT_DOCUMENT_VIEWER,
        { documentId: String(id) },
      );

    return this.documentService.findOne(id);
  }

  @Get(':id/download')
  @ApiOperation({ summary: 'Download a document' })
  @ApiOkResponse({
    description: 'Document downloaded successfully',
  })
  @ApiPrismaErrorResponses({
    errorCode: ErrorCode.DOCUMENT_NOT_FOUND,
    argExtractor: (params) => ({ documentId: String(params.id) }),
    matchers: matchRecordsNotFound('Document'),
  })
  @ApiErrorResponses(ErrorCode.NOT_DOCUMENT_VIEWER)
  async download(
    @CurrentUser('id') userId: number,
    @CurrentUser('role') role: UserRole,
    @Param('id', ParseIntPipe) id: number,
    @Res({ passthrough: true }) res: Response,
  ): Promise<StreamableFile> {
    if (
      role !== UserRole.ADMIN &&
      !(await this.documentService.isVisibleToUser(id, userId))
    )
      throw new ApiException(
        HttpStatus.FORBIDDEN,
        ErrorCode.NOT_DOCUMENT_VIEWER,
        { documentId: String(id) },
      );

    const document = await this.documentService.findOneWithContent(id);

    res.set({
      'Content-Type': contentType(document.title) || 'application/octet-stream',
      'Content-Disposition': `attachment; filename="${document.title}"`,
    });

    return new StreamableFile(Buffer.from(document.content));
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a document by ID' })
  @ApiOkResponse({
    type: Document,
    description: 'Document deleted successfully',
  })
  @ApiPrismaErrorResponses(
    {
      errorCode: ErrorCode.DOCUMENT_NOT_FOUND,
      argExtractor: (params) => ({ documentId: String(params.id) }),
      matchers: matchRecordsNotFound('Document'),
    },
    {
      errorCode: ErrorCode.DOCUMENT_ALREADY_USED,
      argExtractor: (params) => ({ documentId: String(params.id) }),
      matchers: matchDriverAdapter('23001', 'fk_document_transaction'),
    },
  )
  @ApiErrorResponses(ErrorCode.NOT_DOCUMENT_UPLOADER)
  remove(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser('id') userId: number,
    @CurrentUser('role') role: UserRole,
  ) {
    return this.documentService.remove(id, userId, role);
  }
}

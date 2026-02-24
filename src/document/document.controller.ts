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
  UseFilters,
} from '@nestjs/common';
import type { Response } from 'express';
import { contentType } from 'mime-types';
import { DocumentService } from './document.service.js';
import {
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import { Document } from './entities/document.entity.js';
import { ErrorCode } from '../common/enums/error-codes.enum.js';
import { ApiPrismaErrorResponses } from '../prisma/decorators/exception.decorator.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { CurrentUser } from '../auth/decorators/current-user.decorator.js';
import { PrismaExceptionFilter } from '../prisma/filters/exception.filter.js';
import { PrismaError } from 'prisma-error-enum';
import {
  matchConstraintField,
  matchModelName,
} from '../prisma/prisma.matchers.js';
import { ApiPaginatedResponse } from '../common/decorators/pagination.decorator.js';
import { PaginationDto } from '../common/dto/pagination.dto.js';
import { Query } from '@nestjs/common';

@ApiTags('Documents')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@UseFilters(PrismaExceptionFilter)
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
  @ApiPrismaErrorResponses({
    status: HttpStatus.NOT_FOUND,
    description: 'Uploader not found',
    errorCode: ErrorCode.DOCUMENT_UPLOADER_NOT_FOUND,
    args: { uploaderId: 1 },
    prisma: {
      error: PrismaError.ForeignConstraintViolation,
      matcher: matchConstraintField('uploaderId'),
    },
  })
  @UseInterceptors(FileInterceptor('file'))
  create(
    @CurrentUser('id') uploaderId: number,
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
    status: HttpStatus.NOT_FOUND,
    description: 'No document was found with such id',
    errorCode: ErrorCode.DOCUMENT_NOT_FOUND,
    args: { id: 1 },
    prisma: {
      error: PrismaError.RecordsNotFound,
      matcher: matchModelName('Document'),
    },
  })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.documentService.findOne(id);
  }

  @Get(':id/download')
  @ApiOperation({ summary: 'Download a document' })
  @ApiOkResponse({
    description: 'Document downloaded successfully',
  })
  @ApiPrismaErrorResponses({
    status: HttpStatus.NOT_FOUND,
    description: 'No document was found with such id',
    errorCode: ErrorCode.DOCUMENT_NOT_FOUND,
    args: { id: 1 },
    prisma: {
      error: PrismaError.RecordsNotFound,
      matcher: matchModelName('Document'),
    },
  })
  async download(
    @Param('id', ParseIntPipe) id: number,
    @Res({ passthrough: true }) res: Response,
  ): Promise<StreamableFile> {
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
  @ApiPrismaErrorResponses({
    status: HttpStatus.NOT_FOUND,
    description: 'No document was found with such id',
    errorCode: ErrorCode.DOCUMENT_NOT_FOUND,
    args: { id: 1 },
    prisma: {
      error: PrismaError.RecordsNotFound,
      matcher: matchModelName('Document'),
    },
  })
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.documentService.remove(id);
  }
}

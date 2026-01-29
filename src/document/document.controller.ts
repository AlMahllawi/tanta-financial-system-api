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
} from '@nestjs/common';
import { DocumentService } from './document.service';
import { ApiBody, ApiConsumes, ApiOperation, ApiTags } from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';

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
  findAll() {
    return this.documentService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Retrieve a document by ID' })
  findOne(@Param('id') id: string) {
    return this.documentService.findOne(+id);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a document by ID' })
  remove(@Param('id') id: string) {
    return this.documentService.remove(+id);
  }
}

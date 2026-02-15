import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Query,
  Req,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';

import { DocumentsService } from './documents.service';
import { CreateDocumentDto } from './dto/create-document.dto';

function fileName(req: any, file: any, cb: any) {
  const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
  cb(null, unique + extname(file.originalname));
}

@Controller('documents')
export class DocumentsController {
  constructor(private readonly docs: DocumentsService) {}

  // LIST + SEARCH + PAGINATION
  @UseGuards(AuthGuard('jwt'))
  @Get()
  async list(
    @Req() req: any,
    @Query('q') q?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    // NOTE: service kamu sekarang list(params) saja.
    // Jadi kirim params aja (tanpa userId) biar nggak “Expected 1 argument, got 2”.
    return this.docs.list({
      q,
      page: Number(page) || 1,
      limit: Number(limit) || 10,
    });
  }

  @UseGuards(AuthGuard('jwt'))
  @Get(':id')
  async get(@Param('id') id: string) {
    return this.docs.getById(id);
  }

  // UPLOAD + CREATE DOCUMENT
  @UseGuards(AuthGuard('jwt'))
  @Post()
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: './uploads',
        filename: fileName,
      }),
      limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
    }),
  )
  async create(
    @Req() req: any,
    @Body() dto: CreateDocumentDto,
    @UploadedFile() file?: any, // biar TS nggak rewel
  ) {
    if (!file) throw new BadRequestException('File is required');
    const fileUrl = `/uploads/${file.filename}`;
    return this.docs.create(req.user.sub, dto, fileUrl);
  }

  // REQUEST DELETE
  @UseGuards(AuthGuard('jwt'))
  @Delete(':id')
  async requestDelete(@Req() req: any, @Param('id') id: string) {
    // ✅ kirim user object (sub + role) karena service kamu butuh itu
    return this.docs.requestDelete(req.user, id);
  }

  // REQUEST REPLACE (upload file baru)
  @UseGuards(AuthGuard('jwt'))
  @Post(':id/replace')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: './uploads',
        filename: fileName,
      }),
      limits: { fileSize: 10 * 1024 * 1024 },
    }),
  )
  async requestReplace(
    @Req() req: any,
    @Param('id') id: string,
    @UploadedFile() file?: any, // biar TS nggak rewel
    @Body() dto?: Partial<CreateDocumentDto>,
  ) {
    if (!file) throw new BadRequestException('File is required');
    const fileUrl = `/uploads/${file.filename}`;
    // ✅ kirim user object
    return this.docs.requestReplace(req.user, id, fileUrl, dto ?? {});
  }
}

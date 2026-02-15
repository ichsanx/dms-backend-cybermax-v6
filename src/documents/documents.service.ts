import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateDocumentDto } from './dto/create-document.dto';
import {
  DocumentStatus,
  PermissionType,
  RequestStatus,
  Role,
} from '@prisma/client';

@Injectable()
export class DocumentsService {
  constructor(private prisma: PrismaService) {}

  async create(userId: string, dto: CreateDocumentDto, fileUrl: string) {
    return this.prisma.document.create({
      data: {
        title: dto.title,
        description: dto.description,
        documentType: dto.documentType,
        fileUrl,
        createdById: userId,
      },
    });
  }

  async list(params: { q?: string; page?: number; limit?: number }) {
    const q = params.q?.trim();
    const page = Math.max(1, Number(params.page || 1));
    const limit = Math.min(50, Math.max(1, Number(params.limit || 10)));
    const skip = (page - 1) * limit;

    const where = q
      ? {
          OR: [
            { title: { contains: q, mode: 'insensitive' as const } },
            { description: { contains: q, mode: 'insensitive' as const } },
            { documentType: { contains: q, mode: 'insensitive' as const } },
          ],
        }
      : {};

    const [items, total] = await Promise.all([
      this.prisma.document.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        include: {
          createdBy: { select: { id: true, email: true, role: true } },
        },
      }),
      this.prisma.document.count({ where }),
    ]);

    return {
      items,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getById(id: string) {
    const doc = await this.prisma.document.findUnique({
      where: { id },
      include: {
        createdBy: { select: { id: true, email: true, role: true } },
      },
    });
    if (!doc) throw new NotFoundException('Document not found');
    return doc;
  }

  // USER: request delete (admin langsung delete)
  async requestDelete(user: { sub: string; role: Role }, documentId: string) {
    const doc = await this.prisma.document.findUnique({
      where: { id: documentId },
    });
    if (!doc) throw new NotFoundException('Document not found');

    // Admin boleh langsung delete
    if (user.role === Role.ADMIN) {
      await this.prisma.document.delete({ where: { id: documentId } });
      return { ok: true, message: 'Deleted by admin' };
    }

    // Owner boleh request
    if (doc.createdById !== user.sub) {
      throw new ForbiddenException('Only owner can request delete');
    }

    // set status pending
    await this.prisma.document.update({
      where: { id: documentId },
      data: { status: DocumentStatus.PENDING_DELETE },
    });

    // buat permission request
    return this.prisma.permissionRequest.create({
      data: {
        type: PermissionType.DELETE,
        status: RequestStatus.PENDING,
        documentId,
        requestedById: user.sub,
      },
    });
  }

  // USER: request replace (admin langsung replace)
  async requestReplace(
    user: { sub: string; role: Role },
    documentId: string,
    fileUrl: string,
    dto?: Partial<CreateDocumentDto>,
  ) {
    const doc = await this.prisma.document.findUnique({
      where: { id: documentId },
    });
    if (!doc) throw new NotFoundException('Document not found');

    // Admin boleh langsung replace
    if (user.role === Role.ADMIN) {
      return this.prisma.document.update({
        where: { id: documentId },
        data: {
          fileUrl,
          version: { increment: 1 },
          status: DocumentStatus.ACTIVE,
          title: dto?.title ?? doc.title,
          description: dto?.description ?? doc.description,
          documentType: dto?.documentType ?? doc.documentType,
        },
      });
    }

    if (doc.createdById !== user.sub) {
      throw new ForbiddenException('Only owner can request replace');
    }

    // tandai doc pending replace
    await this.prisma.document.update({
      where: { id: documentId },
      data: { status: DocumentStatus.PENDING_REPLACE },
    });

    // ✅ Simpan fileUrl baru di PermissionRequest (replaceFileUrl)
    return this.prisma.permissionRequest.create({
      data: {
        type: PermissionType.REPLACE,
        status: RequestStatus.PENDING,
        documentId,
        requestedById: user.sub,
        replaceFileUrl: fileUrl, // <--- ini kuncinya
      },
    });
  }

  async updateAfterApproveReplace(documentId: string, fileUrl: string) {
    const doc = await this.prisma.document.findUnique({
      where: { id: documentId },
    });
    if (!doc) throw new NotFoundException('Document not found');

    return this.prisma.document.update({
      where: { id: documentId },
      data: {
        fileUrl,
        version: { increment: 1 },
        status: DocumentStatus.ACTIVE,
      },
    });
  }
}

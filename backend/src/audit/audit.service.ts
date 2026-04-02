import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { PaginationDto, paginate, buildPaginatedResponse } from '../common/dto/pagination.dto';

@Injectable()
export class AuditService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Write a single audit log entry.
   * Safe to fire-and-forget (errors are swallowed so they never break the main flow).
   */
  async log(
    userId: number,
    action: string,
    entity: string,
    entityId: number,
    details?: Record<string, unknown>,
  ): Promise<void> {
    await this.prisma.auditLog.create({
      data: {
        userId,
        action,
        entity,
        entityId,
        details: (details as Prisma.InputJsonValue) ?? Prisma.JsonNull,
      },
    });
  }

  async findAll(
    query: PaginationDto & {
      userId?: number;
      action?: string;
      entity?: string;
      dateFrom?: string;
      dateTo?: string;
    },
  ) {
    const { page = 1, limit = 20, userId, action, entity, dateFrom, dateTo } = query;
    const { skip, take } = paginate(page, limit);

    const where: any = {};
    if (userId) where.userId = userId;
    if (action) where.action = action.toUpperCase();
    if (entity) where.entity = entity;
    if (dateFrom || dateTo) {
      where.timestamp = {};
      if (dateFrom) where.timestamp.gte = new Date(dateFrom);
      if (dateTo) where.timestamp.lte = new Date(dateTo);
    }

    const [data, total] = await this.prisma.$transaction([
      this.prisma.auditLog.findMany({
        where,
        include: {
          actor: {
            select: {
              id: true,
              fullName: true,
              code: true,
              email: true,
            },
          },
        },
        skip,
        take,
        orderBy: { timestamp: 'desc' },
      }),
      this.prisma.auditLog.count({ where }),
    ]);

    return buildPaginatedResponse(data, total, page, limit);
  }

  async getStats() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [totalLogs, todayLogs, byAction, byEntity] = await Promise.all([
      this.prisma.auditLog.count(),
      this.prisma.auditLog.count({ where: { timestamp: { gte: today } } }),
      this.prisma.auditLog.groupBy({
        by: ['action'],
        _count: { _all: true },
        orderBy: { _count: { action: 'desc' } },
      }),
      this.prisma.auditLog.groupBy({
        by: ['entity'],
        _count: { _all: true },
        orderBy: { _count: { entity: 'desc' } },
        take: 10,
      }),
    ]);

    return {
      totalLogs,
      todayLogs,
      byAction: byAction.map((a) => ({ action: a.action, count: a._count._all })),
      byEntity: byEntity.map((e) => ({ entity: e.entity, count: e._count._all })),
    };
  }
}

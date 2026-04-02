import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateDecisionDto } from './dto/create-decision.dto';
import { PaginationDto, paginate, buildPaginatedResponse } from '../common/dto/pagination.dto';

@Injectable()
export class RewardService {
  constructor(private readonly prisma: PrismaService) {}

  async createDecision(dto: CreateDecisionDto, actorId: number) {
    const employee = await this.prisma.employee.findUnique({
      where: { id: dto.employeeId },
    });
    if (!employee) throw new NotFoundException('Employee not found');

    const decision = await this.prisma.decision.create({
      data: {
        employeeId: dto.employeeId,
        type: dto.type,
        reason: dto.reason,
        amount: dto.amount,
        date: new Date(dto.date),
      },
    });

    await this.prisma.auditLog.create({
      data: {
        userId: actorId,
        action: 'CREATE',
        entity: 'decision',
        entityId: decision.id,
      },
    });

    return decision;
  }

  async findAll(query: PaginationDto & { type?: string; employeeId?: number }) {
    const { page = 1, limit = 20, type, employeeId } = query;
    const { skip, take } = paginate(page, limit);

    const where: any = {};
    if (type) where.type = type;
    if (employeeId) where.employeeId = employeeId;

    const [data, total] = await this.prisma.$transaction([
      this.prisma.decision.findMany({
        where,
        skip,
        take,
        orderBy: { date: 'desc' },
      }),
      this.prisma.decision.count({ where }),
    ]);

    return buildPaginatedResponse(data, total, page, limit);
  }

  async findOne(id: number) {
    const decision = await this.prisma.decision.findUnique({ where: { id } });
    if (!decision) throw new NotFoundException(`Decision ${id} not found`);
    return decision;
  }

  async findByEmployee(employeeId: number) {
    return this.prisma.decision.findMany({
      where: { employeeId },
      orderBy: { date: 'desc' },
    });
  }
}

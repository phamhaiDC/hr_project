import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { WorkflowEngineService } from '../leave/workflow-engine.service';
import { CreateResignationDto } from './dto/create-resignation.dto';
import { CreateChecklistItemDto } from './dto/create-checklist-item.dto';
import { paginate, buildPaginatedResponse, PaginationDto } from '../common/dto/pagination.dto';

const RESIGNATION_INCLUDE = {
  employee: {
    select: {
      id: true,
      code: true,
      fullName: true,
      email: true,
      department: { select: { id: true, name: true } },
      manager: { select: { id: true, fullName: true, email: true } },
    },
  },
  approvals: { orderBy: { step: 'asc' as const } },
};

@Injectable()
export class OffboardingService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly workflowEngine: WorkflowEngineService,
    private readonly auditService: AuditService,
  ) {}

  // ─── Submit resignation ───────────────────────────────────────────────────

  async submitResignation(dto: CreateResignationDto, employeeId: number) {
    const employee = await this.prisma.employee.findUnique({ where: { id: employeeId } });
    if (!employee) throw new NotFoundException('Employee not found');

    if (employee.status === 'resigned') {
      throw new BadRequestException('Employee is already resigned');
    }

    const existing = await this.prisma.resignationRequest.findFirst({
      where: { employeeId, status: { in: ['pending', 'approved'] } },
    });
    if (existing) {
      throw new BadRequestException('An active resignation request already exists');
    }

    // Build workflow steps (Step 1 = direct manager, Step 2 = any HR)
    const steps = await this.workflowEngine.buildSteps(employeeId);

    const resignation = await this.prisma.resignationRequest.create({
      data: {
        employeeId,
        lastWorkingDate: new Date(dto.lastWorkingDate),
        reason: dto.reason,
        status: 'pending',
        currentStep: 1,
        approvals: {
          create: steps.map((s) => ({
            step: s.step,
            approverRole: s.approverRole,
            approverId: s.assignedApproverId,
            status: 'pending',
          })),
        },
      },
      include: RESIGNATION_INCLUDE,
    });

    await this.auditService.log(
      employeeId,
      'RESIGNATION_SUBMITTED',
      'resignation_request',
      resignation.id,
      { lastWorkingDate: dto.lastWorkingDate },
    );

    return resignation;
  }

  // ─── Queries ──────────────────────────────────────────────────────────────

  async findAll(dto: PaginationDto & { status?: string }) {
    const { page = 1, limit = 20, status } = dto;
    const { skip, take } = paginate(page, limit);

    const where: any = {};
    if (status) where.status = status;

    const [data, total] = await this.prisma.$transaction([
      this.prisma.resignationRequest.findMany({
        where,
        include: RESIGNATION_INCLUDE,
        skip,
        take,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.resignationRequest.count({ where }),
    ]);

    return buildPaginatedResponse(data, total, page, limit);
  }

  async findMy(employeeId: number) {
    return this.prisma.resignationRequest.findMany({
      where: { employeeId },
      include: RESIGNATION_INCLUDE,
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: number) {
    const resignation = await this.prisma.resignationRequest.findUnique({
      where: { id },
      include: RESIGNATION_INCLUDE,
    });
    if (!resignation) throw new NotFoundException(`Resignation #${id} not found`);
    return resignation;
  }

  // ─── Checklist ────────────────────────────────────────────────────────────

  async createChecklistItem(dto: CreateChecklistItemDto) {
    return this.prisma.offboardingChecklist.create({
      data: {
        employeeId: dto.employeeId,
        item: dto.item,
        status: dto.status ?? 'pending',
      },
    });
  }

  async completeChecklistItem(id: number) {
    const item = await this.prisma.offboardingChecklist.findUnique({ where: { id } });
    if (!item) throw new NotFoundException(`Checklist item #${id} not found`);
    if (item.status === 'completed') {
      throw new BadRequestException('Item is already completed');
    }
    return this.prisma.offboardingChecklist.update({
      where: { id },
      data: { status: 'completed' },
    });
  }

  async getChecklist(employeeId: number) {
    const employee = await this.prisma.employee.findUnique({ where: { id: employeeId } });
    if (!employee) throw new NotFoundException('Employee not found');
    return this.prisma.offboardingChecklist.findMany({
      where: { employeeId },
      orderBy: { createdAt: 'asc' },
    });
  }
}

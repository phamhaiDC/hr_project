import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { ApproveResignationDto } from './dto/approve-resignation.dto';

const TOTAL_STEPS = 2;

const DEFAULT_CHECKLIST_ITEMS = [
  'Return laptop and peripherals',
  'Return access card / key fob',
  'Deactivate system accounts',
  'Complete knowledge handover documentation',
  'Conduct exit interview',
];

@Injectable()
export class OffboardingApprovalService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
  ) {}

  // ─── Approve ─────────────────────────────────────────────────────────────

  async approve(
    resignationId: number,
    dto: ApproveResignationDto,
    actorId: number,
    actorRole: string,
  ) {
    const { request, stepRecord } = await this.loadAndGuard(resignationId, actorId, actorRole);
    const currentStep = request.currentStep ?? 1;

    await this.prisma.resignationApproval.update({
      where: { id: stepRecord.id },
      data: {
        status: 'approved',
        approverId: actorId,
        comments: dto.comments ?? null,
        actionTime: new Date(),
      },
    });

    if (currentStep >= TOTAL_STEPS) {
      // Final approval: mark request + set employee resigned + generate checklist
      await this.finalise(resignationId, request.employeeId);

      await this.auditService.log(
        actorId,
        'RESIGNATION_APPROVED',
        'resignation_request',
        resignationId,
        { step: currentStep, comments: dto.comments ?? null },
      );

      return {
        message: 'Resignation fully approved. Employee status set to resigned.',
        status: 'approved',
        currentStep,
      };
    }

    const nextStep = currentStep + 1;
    await this.prisma.resignationRequest.update({
      where: { id: resignationId },
      data: { currentStep: nextStep },
    });

    await this.auditService.log(
      actorId,
      'RESIGNATION_STEP_APPROVED',
      'resignation_request',
      resignationId,
      { step: currentStep, nextStep, comments: dto.comments ?? null },
    );

    return {
      message: `Step ${currentStep} approved. Awaiting step ${nextStep} (HR).`,
      status: 'pending',
      currentStep: nextStep,
    };
  }

  // ─── Reject ──────────────────────────────────────────────────────────────

  async reject(
    resignationId: number,
    dto: ApproveResignationDto,
    actorId: number,
    actorRole: string,
  ) {
    const { request, stepRecord } = await this.loadAndGuard(resignationId, actorId, actorRole);
    const currentStep = request.currentStep ?? 1;

    await this.prisma.$transaction([
      this.prisma.resignationApproval.update({
        where: { id: stepRecord.id },
        data: {
          status: 'rejected',
          approverId: actorId,
          comments: dto.comments ?? null,
          actionTime: new Date(),
        },
      }),
      this.prisma.resignationRequest.update({
        where: { id: resignationId },
        data: { status: 'rejected' },
      }),
    ]);

    await this.auditService.log(
      actorId,
      'RESIGNATION_REJECTED',
      'resignation_request',
      resignationId,
      { step: currentStep, comments: dto.comments ?? null },
    );

    return {
      message: `Resignation rejected at step ${currentStep}.`,
      status: 'rejected',
      currentStep,
    };
  }

  // ─── Private helpers ──────────────────────────────────────────────────────

  private async loadAndGuard(
    resignationId: number,
    actorId: number,
    actorRole: string,
  ) {
    const request = await this.prisma.resignationRequest.findUnique({
      where: { id: resignationId },
      include: { approvals: { orderBy: { step: 'asc' } } },
    });

    if (!request) {
      throw new NotFoundException(`Resignation request #${resignationId} not found`);
    }

    if (request.status !== 'pending') {
      throw new BadRequestException(
        `Resignation request is already ${request.status} — no further action allowed`,
      );
    }

    const currentStep = request.currentStep ?? 1;
    const stepRecord = request.approvals.find((a) => a.step === currentStep);

    if (!stepRecord) {
      throw new BadRequestException(
        `Workflow integrity error: no approval record for step ${currentStep}`,
      );
    }

    if (stepRecord.status !== 'pending') {
      throw new BadRequestException(
        `Step ${currentStep} was already ${stepRecord.status} — you cannot act on it again`,
      );
    }

    // Role + identity checks
    if (actorRole !== 'admin') {
      if (currentStep === 1) {
        if (actorRole !== 'manager') {
          throw new ForbiddenException('Step 1 requires a manager role');
        }
        if (stepRecord.approverId !== null && stepRecord.approverId !== actorId) {
          throw new ForbiddenException(
            'Only the direct manager of this employee can act on step 1',
          );
        }
      } else if (currentStep === 2) {
        if (actorRole !== 'hr') {
          throw new ForbiddenException('Step 2 requires an HR role');
        }
      }
    }

    return { request, stepRecord };
  }

  private async finalise(resignationId: number, employeeId: number | null) {
    const ops: any[] = [
      this.prisma.resignationRequest.update({
        where: { id: resignationId },
        data: { status: 'approved' },
      }),
    ];

    if (employeeId) {
      ops.push(
        this.prisma.employee.update({
          where: { id: employeeId },
          data: { status: 'resigned' },
        }),
      );

      // Auto-generate default offboarding checklist
      ops.push(
        this.prisma.offboardingChecklist.createMany({
          data: DEFAULT_CHECKLIST_ITEMS.map((item) => ({ employeeId, item, status: 'pending' })),
          skipDuplicates: false,
        }),
      );
    }

    await this.prisma.$transaction(ops);
  }
}

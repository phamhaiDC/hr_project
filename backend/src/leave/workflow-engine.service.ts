import {
  Injectable,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

export interface WorkflowStep {
  step: number;
  approverRole: string;
  /** Pre-assigned approver id. null = "any member of this role" (e.g. HR). */
  assignedApproverId: number | null;
}

/** Total number of approval steps in the leave workflow. */
export const TOTAL_STEPS = 2;

@Injectable()
export class WorkflowEngineService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Builds the ordered step definitions for a leave request.
   *   Step 1 → employee's direct manager (must be assigned).
   *   Step 2 → any HR user (no pre-assignment).
   */
  async buildSteps(employeeId: number): Promise<WorkflowStep[]> {
    const employee = await this.prisma.employee.findUnique({
      where: { id: employeeId },
      select: { managerId: true },
    });

    if (!employee) {
      throw new BadRequestException('Employee not found');
    }

    if (!employee.managerId) {
      throw new BadRequestException(
        'Employee has no manager assigned. Cannot submit a leave request.',
      );
    }

    return [
      {
        step: 1,
        approverRole: 'manager',
        assignedApproverId: employee.managerId,
      },
      {
        step: 2,
        approverRole: 'hr',
        assignedApproverId: null, // any HR user may approve
      },
    ];
  }

  /**
   * Validates that the acting user is authorised for the current step.
   *
   * Rules enforced:
   *  - Step 1: must be role=manager AND be the pre-assigned manager (identity check).
   *  - Step 2: must be role=hr (any HR user may act).
   *  - admin bypasses all checks.
   *  - Steps must be processed in order; the caller ensures currentStep is correct.
   *
   * Throws ForbiddenException or BadRequestException on any violation.
   */
  validateAuthorisation(
    currentStep: number,
    actorId: number,
    actorRole: string,
    assignedApproverId: number | null,
  ): void {
    if (actorRole === 'admin') return;

    if (currentStep === 1) {
      if (actorRole !== 'manager') {
        throw new ForbiddenException(
          'Step 1 can only be approved by a manager. Your role is not authorised.',
        );
      }
      // Identity check: only the pre-assigned direct manager may act
      if (assignedApproverId !== null && actorId !== assignedApproverId) {
        throw new ForbiddenException(
          'You are not the assigned approver for step 1. Only the direct manager of this employee can act.',
        );
      }
      return;
    }

    if (currentStep === 2) {
      if (actorRole !== 'hr') {
        throw new ForbiddenException(
          'Step 2 can only be approved by an HR user. Your role is not authorised.',
        );
      }
      return;
    }

    throw new BadRequestException(`Unknown workflow step: ${currentStep}`);
  }

  isLastStep(step: number): boolean {
    return step >= TOTAL_STEPS;
  }
}

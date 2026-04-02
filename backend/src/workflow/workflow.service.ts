import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateApprovalFlowDto } from './dto/create-flow.dto';

@Injectable()
export class WorkflowService {
  constructor(private readonly prisma: PrismaService) {}

  async createFlow(dto: CreateApprovalFlowDto) {
    return this.prisma.approvalFlow.create({
      data: {
        type: dto.type,
        steps: {
          create: dto.steps.map((s) => ({
            stepOrder: s.stepOrder,
            approverType: s.approverType,
          })),
        },
      },
      include: { steps: { orderBy: { stepOrder: 'asc' } } },
    });
  }

  async findAll(type?: string) {
    return this.prisma.approvalFlow.findMany({
      where: type ? { type } : undefined,
      include: { steps: { orderBy: { stepOrder: 'asc' } } },
      orderBy: { id: 'desc' },
    });
  }

  async findOne(id: number) {
    const flow = await this.prisma.approvalFlow.findUnique({
      where: { id },
      include: { steps: { orderBy: { stepOrder: 'asc' } } },
    });
    if (!flow) throw new NotFoundException(`Approval flow ${id} not found`);
    return flow;
  }

  async remove(id: number) {
    await this.findOne(id);
    await this.prisma.approvalStep.deleteMany({ where: { flowId: id } });
    return this.prisma.approvalFlow.delete({ where: { id } });
  }
}

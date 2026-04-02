import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateContractDto } from './dto/create-contract.dto';
import { PaginationDto, paginate, buildPaginatedResponse } from '../common/dto/pagination.dto';

@Injectable()
export class ContractService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateContractDto, actorId: number) {
    const employee = await this.prisma.employee.findUnique({
      where: { id: dto.employeeId },
    });
    if (!employee) throw new NotFoundException('Employee not found');

    const contract = await this.prisma.contract.create({
      data: {
        employeeId: dto.employeeId,
        type: dto.type,
        startDate: new Date(dto.startDate),
        endDate: dto.endDate ? new Date(dto.endDate) : undefined,
        status: dto.status ?? 'active',
      },
    });

    await this.prisma.auditLog.create({
      data: {
        userId: actorId,
        action: 'CREATE',
        entity: 'contract',
        entityId: contract.id,
      },
    });

    return contract;
  }

  async findAll(query: PaginationDto & { employeeId?: number; status?: string }) {
    const { page = 1, limit = 20, employeeId, status } = query;
    const { skip, take } = paginate(page, limit);

    const where: any = {};
    if (employeeId) where.employeeId = employeeId;
    if (status) where.status = status;

    const [data, total] = await this.prisma.$transaction([
      this.prisma.contract.findMany({
        where,
        skip,
        take,
        orderBy: { startDate: 'desc' },
      }),
      this.prisma.contract.count({ where }),
    ]);

    return buildPaginatedResponse(data, total, page, limit);
  }

  async findOne(id: number) {
    const contract = await this.prisma.contract.findUnique({ where: { id } });
    if (!contract) throw new NotFoundException(`Contract ${id} not found`);
    return contract;
  }

  async terminate(id: number, actorId: number) {
    const contract = await this.findOne(id);
    if (contract.status === 'terminated') {
      throw new ConflictException('Contract is already terminated');
    }

    const updated = await this.prisma.contract.update({
      where: { id },
      data: { status: 'terminated' },
    });

    await this.prisma.auditLog.create({
      data: {
        userId: actorId,
        action: 'UPDATE',
        entity: 'contract',
        entityId: id,
      },
    });

    return updated;
  }
}

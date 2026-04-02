import {
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateBranchDto } from './dto/create-branch.dto';
import { CreateDepartmentDto } from './dto/create-department.dto';
import { CreatePositionDto } from './dto/create-position.dto';

@Injectable()
export class OrganizationService {
  constructor(private readonly prisma: PrismaService) {}

  // ── Branches ──────────────────────────────────────────────

  async createBranch(dto: CreateBranchDto) {
    return this.prisma.branch.create({ data: { name: dto.name } });
  }

  async findAllBranches() {
    return this.prisma.branch.findMany({
      include: {
        departments: { select: { id: true, name: true } },
        _count: { select: { employees: true } },
      },
      orderBy: { id: 'asc' },
    });
  }

  async findOneBranch(id: number) {
    const branch = await this.prisma.branch.findUnique({
      where: { id },
      include: {
        departments: {
          select: { id: true, name: true },
        },
        _count: { select: { employees: true } },
      },
    });
    if (!branch) throw new NotFoundException(`Branch ${id} not found`);
    return branch;
  }

  async updateBranch(id: number, dto: Partial<CreateBranchDto>) {
    await this.findOneBranch(id);
    return this.prisma.branch.update({ where: { id }, data: dto });
  }

  // ── Departments ────────────────────────────────────────────

  async createDepartment(dto: CreateDepartmentDto) {
    return this.prisma.department.create({
      data: { name: dto.name, branchId: dto.branchId },
      include: { branch: { select: { id: true, name: true } } },
    });
  }

  async findAllDepartments(branchId?: number) {
    return this.prisma.department.findMany({
      where: branchId ? { branchId } : undefined,
      include: {
        branch: { select: { id: true, name: true } },
        _count: { select: { employees: true } },
      },
      orderBy: { id: 'asc' },
    });
  }

  async findOneDepartment(id: number) {
    const dept = await this.prisma.department.findUnique({
      where: { id },
      include: {
        branch: { select: { id: true, name: true } },
        _count: { select: { employees: true } },
      },
    });
    if (!dept) throw new NotFoundException(`Department ${id} not found`);
    return dept;
  }

  async updateDepartment(id: number, dto: Partial<CreateDepartmentDto>) {
    await this.findOneDepartment(id);
    return this.prisma.department.update({
      where: { id },
      data: dto,
      include: { branch: { select: { id: true, name: true } } },
    });
  }

  // ── Positions ──────────────────────────────────────────────

  async createPosition(dto: CreatePositionDto) {
    return this.prisma.position.create({
      data: { name: dto.name },
    });
  }

  async findAllPositions(departmentId?: number) {
    // Position doesn't have departmentId in the real schema, ignore filter
    void departmentId;
    return this.prisma.position.findMany({
      include: {
        _count: { select: { employees: true } },
      },
      orderBy: { id: 'asc' },
    });
  }

  async findOnePosition(id: number) {
    const pos = await this.prisma.position.findUnique({
      where: { id },
      include: {
        _count: { select: { employees: true } },
      },
    });
    if (!pos) throw new NotFoundException(`Position ${id} not found`);
    return pos;
  }

  async updatePosition(id: number, dto: Partial<CreatePositionDto>) {
    await this.findOnePosition(id);
    return this.prisma.position.update({
      where: { id },
      data: { name: dto.name },
    });
  }
}

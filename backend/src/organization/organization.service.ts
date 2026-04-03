import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { haversineMetres } from '../attendance/location.service';
import { CreateBranchDto } from './dto/create-branch.dto';
import { CreateDepartmentDto } from './dto/create-department.dto';
import { UpdateDepartmentDto } from './dto/update-department.dto';
import { CreatePositionDto } from './dto/create-position.dto';
import { UpdatePositionDto } from './dto/update-position.dto';

export interface NearestBranchResult {
  id: number;
  name: string;
  distanceM: number;
  isInOffice: boolean;
}

/** The 3 rotating shifts auto-created for SHIFT-type departments (Command Center). */
const CC_SHIFTS = [
  { name: 'Morning',   code: 'MORNING',   startTime: '07:00', endTime: '15:00', isCrossDay: false },
  { name: 'Afternoon', code: 'AFTERNOON', startTime: '15:00', endTime: '23:00', isCrossDay: false },
  { name: 'Night',     code: 'NIGHT',     startTime: '23:00', endTime: '07:00', isCrossDay: true  },
];

@Injectable()
export class OrganizationService {
  constructor(private readonly prisma: PrismaService) {}

  // ── Branches ──────────────────────────────────────────────────────────────

  async createBranch(dto: CreateBranchDto) {
    return this.prisma.branch.create({
      data: {
        name:      dto.name,
        latitude:  dto.latitude,
        longitude: dto.longitude,
        radius:    dto.radius ?? 50,
      },
    });
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
        departments: { select: { id: true, name: true } },
        _count: { select: { employees: true } },
      },
    });
    if (!branch) throw new NotFoundException(`Branch ${id} not found`);
    return branch;
  }

  async updateBranch(id: number, dto: Partial<CreateBranchDto>) {
    await this.findOneBranch(id);
    return this.prisma.branch.update({
      where: { id },
      data: {
        ...(dto.name      !== undefined && { name:      dto.name }),
        ...(dto.latitude  !== undefined && { latitude:  dto.latitude }),
        ...(dto.longitude !== undefined && { longitude: dto.longitude }),
        ...(dto.radius    !== undefined && { radius:    dto.radius }),
      },
    });
  }

  async findNearestBranch(lat: number, lng: number): Promise<NearestBranchResult | null> {
    const branches = await this.prisma.branch.findMany({
      where: { latitude: { not: null }, longitude: { not: null } },
      select: { id: true, name: true, latitude: true, longitude: true, radius: true },
    });

    if (!branches.length) return null;

    let nearest: NearestBranchResult | null = null;
    for (const branch of branches) {
      if (branch.latitude == null || branch.longitude == null) continue;
      const distanceM = Math.round(haversineMetres(lat, lng, branch.latitude, branch.longitude));
      if (!nearest || distanceM < nearest.distanceM) {
        nearest = { id: branch.id, name: branch.name, distanceM, isInOffice: distanceM <= (branch.radius ?? 50) };
      }
    }
    return nearest;
  }

  // ── Departments ───────────────────────────────────────────────────────────

  async createDepartment(dto: CreateDepartmentDto) {
    // Validate code uniqueness
    const existing = await this.prisma.department.findUnique({ where: { code: dto.code } });
    if (existing) throw new ConflictException(`Department code "${dto.code}" is already in use`);

    const workingType = dto.workingType ?? 'FIXED';

    if (workingType === 'SHIFT' && dto.branchId) {
      // Validate branch exists
      const branch = await this.prisma.branch.findUnique({ where: { id: dto.branchId } });
      if (!branch) throw new NotFoundException(`Branch ${dto.branchId} not found`);
    }

    const dept = await this.prisma.department.create({
      data: {
        name:        dto.name,
        code:        dto.code,
        workingType,
        description: dto.description,
        isActive:    dto.isActive ?? true,
        branchId:    dto.branchId,
      },
      include: {
        branch: { select: { id: true, name: true } },
        _count: { select: { employees: true, positions: true, shifts: true } },
      },
    });

    // Auto-create the 3 CC shifts for any SHIFT-type department
    if (workingType === 'SHIFT') {
      await this.prisma.shift.createMany({
        data: CC_SHIFTS.map((s, i) => ({
          name:         s.name,
          code:         `${dept.code}_${s.code}_${dept.id}`,
          startTime:    s.startTime,
          endTime:      s.endTime,
          isCrossDay:   s.isCrossDay,
          departmentId: dept.id,
          breakMinutes: 0,
          isDefault:    false,
          isActive:     true,
        })),
        skipDuplicates: true,
      });
    }

    return dept;
  }

  async findAllDepartments(branchId?: number, activeOnly = false) {
    return this.prisma.department.findMany({
      where: {
        ...(branchId   ? { branchId }     : {}),
        ...(activeOnly ? { isActive: true } : {}),
      },
      include: {
        branch: { select: { id: true, name: true } },
        _count: { select: { employees: true, positions: true, shifts: true } },
      },
      orderBy: { name: 'asc' },
    });
  }

  async findOneDepartment(id: number) {
    const dept = await this.prisma.department.findUnique({
      where: { id },
      include: {
        branch:    { select: { id: true, name: true } },
        shifts:    { orderBy: { startTime: 'asc' } },
        positions: {
          where: { isActive: true },
          select: { id: true, name: true, code: true },
          orderBy: { name: 'asc' },
        },
        _count: { select: { employees: true, positions: true } },
      },
    });
    if (!dept) throw new NotFoundException(`Department ${id} not found`);
    return dept;
  }

  async updateDepartment(id: number, dto: UpdateDepartmentDto) {
    const dept = await this.prisma.department.findUnique({ where: { id } });
    if (!dept) throw new NotFoundException(`Department ${id} not found`);

    if (dto.code && dto.code !== dept.code) {
      const clash = await this.prisma.department.findUnique({ where: { code: dto.code } });
      if (clash) throw new ConflictException(`Department code "${dto.code}" is already in use`);
    }

    // Detect FIXED → SHIFT transition: auto-create CC shifts if none exist yet
    const newWorkingType = dto.workingType ?? dept.workingType;
    const wasFixed = dept.workingType === 'FIXED';
    const becomesShift = newWorkingType === 'SHIFT';

    const updated = await this.prisma.department.update({
      where: { id },
      data: {
        ...(dto.name        !== undefined && { name:        dto.name }),
        ...(dto.code        !== undefined && { code:        dto.code }),
        ...(dto.workingType !== undefined && { workingType: dto.workingType }),
        ...(dto.description !== undefined && { description: dto.description }),
        ...(dto.isActive    !== undefined && { isActive:    dto.isActive }),
        ...(dto.branchId    !== undefined && { branchId:    dto.branchId }),
      },
      include: {
        branch:    { select: { id: true, name: true } },
        shifts:    { orderBy: { startTime: 'asc' } },
        _count:    { select: { employees: true, positions: true, shifts: true } },
      },
    });

    if (wasFixed && becomesShift) {
      const existingShifts = await this.prisma.shift.count({ where: { departmentId: id } });
      if (existingShifts === 0) {
        await this.prisma.shift.createMany({
          data: CC_SHIFTS.map((s) => ({
            name:         s.name,
            code:         `${dept.code}_${s.code}_${id}`,
            startTime:    s.startTime,
            endTime:      s.endTime,
            isCrossDay:   s.isCrossDay,
            departmentId: id,
            breakMinutes: 0,
            isDefault:    false,
            isActive:     true,
          })),
          skipDuplicates: true,
        });
      }
    }

    return updated;
  }

  async deleteDepartment(id: number) {
    const dept = await this.prisma.department.findUnique({
      where: { id },
      include: { _count: { select: { positions: true } } },
    });
    if (!dept) throw new NotFoundException(`Department ${id} not found`);

    if (dept._count.positions > 0) {
      throw new BadRequestException(
        `Cannot delete department "${dept.name}" — it still has ${dept._count.positions} position(s). ` +
        'Delete or reassign them first.',
      );
    }

    // Cascade: delete department-specific shifts (CC shifts)
    await this.prisma.shift.deleteMany({ where: { departmentId: id } });

    return this.prisma.department.delete({ where: { id } });
  }

  // ── Positions ─────────────────────────────────────────────────────────────

  async createPosition(dto: CreatePositionDto) {
    const existing = await this.prisma.position.findUnique({ where: { code: dto.code } });
    if (existing) throw new ConflictException(`Position code "${dto.code}" is already in use`);

    const dept = await this.prisma.department.findUnique({ where: { id: dto.departmentId } });
    if (!dept) throw new NotFoundException(`Department ${dto.departmentId} not found`);

    return this.prisma.position.create({
      data: {
        name:         dto.name,
        code:         dto.code,
        departmentId: dto.departmentId,
        description:  dto.description,
        isActive:     dto.isActive ?? true,
      },
      include: {
        department: { select: { id: true, name: true, code: true } },
        _count: { select: { employees: true } },
      },
    });
  }

  async findAllPositions(departmentId?: number, activeOnly = false) {
    return this.prisma.position.findMany({
      where: {
        ...(departmentId ? { departmentId }   : {}),
        ...(activeOnly   ? { isActive: true } : {}),
      },
      include: {
        department: { select: { id: true, name: true, code: true } },
        _count: { select: { employees: true } },
      },
      orderBy: { name: 'asc' },
    });
  }

  async findOnePosition(id: number) {
    const pos = await this.prisma.position.findUnique({
      where: { id },
      include: {
        department: { select: { id: true, name: true, code: true, workingType: true } },
        _count: { select: { employees: true } },
      },
    });
    if (!pos) throw new NotFoundException(`Position ${id} not found`);
    return pos;
  }

  async updatePosition(id: number, dto: UpdatePositionDto) {
    const pos = await this.prisma.position.findUnique({ where: { id } });
    if (!pos) throw new NotFoundException(`Position ${id} not found`);

    if (dto.code && dto.code !== pos.code) {
      const clash = await this.prisma.position.findUnique({ where: { code: dto.code } });
      if (clash) throw new ConflictException(`Position code "${dto.code}" is already in use`);
    }

    if (dto.departmentId) {
      const dept = await this.prisma.department.findUnique({ where: { id: dto.departmentId } });
      if (!dept) throw new NotFoundException(`Department ${dto.departmentId} not found`);
    }

    return this.prisma.position.update({
      where: { id },
      data: {
        ...(dto.name         !== undefined && { name:         dto.name }),
        ...(dto.code         !== undefined && { code:         dto.code }),
        ...(dto.departmentId !== undefined && { departmentId: dto.departmentId }),
        ...(dto.description  !== undefined && { description:  dto.description }),
        ...(dto.isActive     !== undefined && { isActive:     dto.isActive }),
      },
      include: {
        department: { select: { id: true, name: true, code: true } },
        _count: { select: { employees: true } },
      },
    });
  }

  async deletePosition(id: number) {
    const pos = await this.prisma.position.findUnique({
      where: { id },
      include: { _count: { select: { employees: true } } },
    });
    if (!pos) throw new NotFoundException(`Position ${id} not found`);

    if (pos._count.employees > 0) {
      throw new BadRequestException(
        `Cannot delete position "${pos.name}" — it is assigned to ${pos._count.employees} employee(s).`,
      );
    }

    return this.prisma.position.delete({ where: { id } });
  }

  // ── Shifts (read-only from org perspective) ───────────────────────────────

  async getShiftsByDepartment(departmentId: number) {
    const dept = await this.prisma.department.findUnique({ where: { id: departmentId } });
    if (!dept) throw new NotFoundException(`Department ${departmentId} not found`);

    return this.prisma.shift.findMany({
      where: { departmentId },
      orderBy: { startTime: 'asc' },
    });
  }
}

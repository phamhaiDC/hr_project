import {
  Injectable,
  NotFoundException,
  ConflictException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { CreateEmployeeDto } from './dto/create-employee.dto';
import { UpdateEmployeeDto } from './dto/update-employee.dto';
import { ListEmployeeDto } from './dto/list-employee.dto';
import { paginate, buildPaginatedResponse } from '../common/dto/pagination.dto';
import * as bcrypt from 'bcrypt';

const EMPLOYEE_SELECT = {
  id: true,
  code: true,
  fullName: true,
  email: true,
  phone: true,
  status: true,
  role: true,
  branchId: true,
  departmentId: true,
  positionId: true,
  managerId: true,
  joinDate: true,
  createdAt: true,
  updatedAt: true,
  branch: { select: { id: true, name: true } },
  department: { select: { id: true, name: true } },
  position: { select: { id: true, name: true } },
  manager: { select: { id: true, fullName: true, code: true, email: true } },
};

/** Fields that trigger an EmployeeHistory entry when changed. */
const TRACKED_FIELDS = ['departmentId', 'positionId', 'managerId', 'status', 'role'] as const;
type TrackedField = (typeof TRACKED_FIELDS)[number];

@Injectable()
export class EmployeeService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
  ) {}

  // ─── Create ───────────────────────────────────────────────────────────────

  async create(dto: CreateEmployeeDto, actorId: number) {
    const existing = await this.prisma.employee.findUnique({ where: { email: dto.email } });
    if (existing) throw new ConflictException('Email already in use');

    const hashedPassword = await bcrypt.hash(
      dto.password,
      parseInt(process.env.BCRYPT_SALT_ROUNDS || '12'),
    );

    const emp = await this.prisma.employee.create({
      data: {
        code: dto.code,
        fullName: dto.fullName,
        email: dto.email,
        password: hashedPassword,
        phone: dto.phone,
        branchId: dto.branchId,
        departmentId: dto.departmentId,
        positionId: dto.positionId,
        managerId: dto.managerId,
        status: dto.status ?? 'probation',
        role: dto.role ?? 'employee',
      },
      select: EMPLOYEE_SELECT,
    });

    await this.auditService.log(actorId, 'EMPLOYEE_CREATED', 'employee', emp.id, {
      code: dto.code,
      email: dto.email,
    });

    return emp;
  }

  // ─── Find all / one ───────────────────────────────────────────────────────

  async findAll(dto: ListEmployeeDto) {
    const { page = 1, limit = 20, search, status, role, branchId, departmentId } = dto;
    const { skip, take } = paginate(page, limit);

    const where: any = {};

    if (search) {
      where.OR = [
        { fullName: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { code: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (status) where.status = status;
    if (role) where.role = role;
    if (branchId) where.branchId = branchId;
    if (departmentId) where.departmentId = departmentId;

    const [data, total] = await this.prisma.$transaction([
      this.prisma.employee.findMany({ where, select: EMPLOYEE_SELECT, skip, take, orderBy: { createdAt: 'desc' } }),
      this.prisma.employee.count({ where }),
    ]);

    return buildPaginatedResponse(data, total, page, limit);
  }

  async findOne(id: number) {
    const employee = await this.prisma.employee.findUnique({
      where: { id },
      select: {
        ...EMPLOYEE_SELECT,
        subordinates: { select: { id: true, fullName: true, code: true, email: true } },
      },
    });

    if (!employee) throw new NotFoundException(`Employee with ID ${id} not found`);
    return employee;
  }

  // ─── Update (with auto history tracking) ─────────────────────────────────

  async update(id: number, dto: UpdateEmployeeDto, actorId: number) {
    const employee = await this.prisma.employee.findUnique({ where: { id } });
    if (!employee) throw new NotFoundException(`Employee with ID ${id} not found`);

    if (dto.email && dto.email !== employee.email) {
      const emailTaken = await this.prisma.employee.findUnique({ where: { email: dto.email } });
      if (emailTaken) throw new ConflictException('Email already in use');
    }

    const updated = await this.prisma.employee.update({
      where: { id },
      data: {
        fullName: dto.fullName,
        email: dto.email,
        phone: dto.phone,
        status: dto.status,
        role: dto.role,
        branchId: dto.branchId,
        departmentId: dto.departmentId,
        positionId: dto.positionId,
        managerId: dto.managerId,
      },
      select: EMPLOYEE_SELECT,
    });

    // ── Auto-insert EmployeeHistory for tracked fields that changed ──────────
    const today = new Date();
    const historyRecords: Array<{
      employeeId: number;
      field: string;
      oldValue: string | null;
      newValue: string | null;
      changedBy: number;
      effectiveDate: Date;
    }> = [];

    for (const field of TRACKED_FIELDS) {
      const dtoValue = dto[field as keyof UpdateEmployeeDto];
      if (dtoValue === undefined) continue;

      const oldRaw = employee[field as keyof typeof employee];
      const newRaw = dtoValue;

      const oldValue = oldRaw != null ? String(oldRaw) : null;
      const newValue = newRaw != null ? String(newRaw) : null;

      if (oldValue !== newValue) {
        historyRecords.push({
          employeeId: id,
          field,
          oldValue,
          newValue,
          changedBy: actorId,
          effectiveDate: today,
        });
      }
    }

    if (historyRecords.length > 0) {
      await this.prisma.employeeHistory.createMany({ data: historyRecords });
    }

    await this.auditService.log(actorId, 'EMPLOYEE_UPDATED', 'employee', id, {
      changedFields: historyRecords.map((r) => r.field),
    });

    return updated;
  }

  // ─── Remove ───────────────────────────────────────────────────────────────

  async remove(id: number, actorId: number) {
    const employee = await this.prisma.employee.findUnique({ where: { id } });
    if (!employee) throw new NotFoundException(`Employee with ID ${id} not found`);
    if (id === actorId) throw new ForbiddenException('Cannot deactivate your own account');

    const updated = await this.prisma.employee.update({
      where: { id },
      data: { status: 'resigned' },
      select: EMPLOYEE_SELECT,
    });

    await this.auditService.log(actorId, 'EMPLOYEE_DEACTIVATED', 'employee', id);

    return updated;
  }

  // ─── History ──────────────────────────────────────────────────────────────

  async getHistory(id: number) {
    const employee = await this.prisma.employee.findUnique({ where: { id } });
    if (!employee) throw new NotFoundException(`Employee with ID ${id} not found`);

    return this.prisma.employeeHistory.findMany({
      where: { employeeId: id },
      orderBy: { createdAt: 'desc' },
    });
  }
}

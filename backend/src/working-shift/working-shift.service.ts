import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateWorkingShiftDto } from './dto/create-working-shift.dto';
import { UpdateWorkingShiftDto } from './dto/update-working-shift.dto';

/** Convert "HH:MM" to minutes since midnight */
function toMin(hhmm: string): number {
  const [h, m] = hhmm.split(':').map(Number);
  return h * 60 + m;
}

/** Check whether two time ranges [s1,e1] and [s2,e2] overlap (cross-day aware). */
function overlaps(
  s1: string, e1: string, cross1: boolean,
  s2: string, e2: string, cross2: boolean,
): boolean {
  const start1 = toMin(s1);
  let end1 = toMin(e1);
  if (cross1 && end1 <= start1) end1 += 1440;

  const start2 = toMin(s2);
  let end2 = toMin(e2);
  if (cross2 && end2 <= start2) end2 += 1440;

  // Normalize start2/end2 relative to start1 to handle midnight crossing
  const shift = start2 < start1 - 120 ? 1440 : 0;
  const ns2 = start2 + shift;
  const ne2 = end2 + shift;

  return ns2 < end1 && ne2 > start1;
}

const SHIFT_INCLUDE = {
  department: { select: { id: true, name: true, code: true } },
  _count: { select: { currentEmployees: true, attendances: true } },
} as const;

@Injectable()
export class WorkingShiftService {
  constructor(private readonly prisma: PrismaService) {}

  // ── List ──────────────────────────────────────────────────────────────────

  findAll(params?: {
    departmentId?: number;
    includeGlobal?: boolean;
    activeOnly?: boolean;
  }) {
    const { departmentId, includeGlobal = true, activeOnly = false } = params ?? {};

    const where: any = {};

    if (departmentId !== undefined) {
      // Return dept-specific AND global shifts together
      where.OR = [
        { departmentId },
        ...(includeGlobal ? [{ departmentId: null }] : []),
      ];
    }

    if (activeOnly) where.isActive = true;

    return this.prisma.shift.findMany({
      where,
      include: SHIFT_INCLUDE,
      orderBy: [{ departmentId: 'asc' }, { startTime: 'asc' }],
    });
  }

  async findOne(id: number) {
    const shift = await this.prisma.shift.findUnique({
      where: { id },
      include: SHIFT_INCLUDE,
    });
    if (!shift) throw new NotFoundException(`Working shift #${id} not found`);
    return shift;
  }

  // ── Create ────────────────────────────────────────────────────────────────

  async create(dto: CreateWorkingShiftDto) {
    // Validate start ≠ end
    if (dto.startTime === dto.endTime) {
      throw new BadRequestException('startTime and endTime must not be equal');
    }

    // Auto-detect isCrossDay when not provided
    const isCrossDay = dto.isCrossDay ?? toMin(dto.endTime) < toMin(dto.startTime);

    // Code uniqueness
    const existing = await this.prisma.shift.findUnique({ where: { code: dto.code } });
    if (existing) throw new ConflictException(`Shift code "${dto.code}" is already in use`);

    // Validate department exists (if provided)
    if (dto.departmentId) {
      const dept = await this.prisma.department.findUnique({ where: { id: dto.departmentId } });
      if (!dept) throw new NotFoundException(`Department #${dto.departmentId} not found`);
    }

    // Overlap check within same department scope
    await this.assertNoOverlap(dto.startTime, dto.endTime, isCrossDay, dto.departmentId);

    // Only one global default allowed
    if (dto.isDefault) {
      await this.prisma.shift.updateMany({
        where: { isDefault: true },
        data: { isDefault: false },
      });
    }

    return this.prisma.shift.create({
      data: {
        name:              dto.name,
        code:              dto.code.toUpperCase(),
        startTime:         dto.startTime,
        endTime:           dto.endTime,
        isCrossDay,
        breakMinutes:      dto.breakMinutes      ?? 60,
        graceLateMinutes:  dto.graceLateMinutes  ?? 15,
        graceEarlyMinutes: dto.graceEarlyMinutes ?? 15,
        departmentId:      dto.departmentId      ?? null,
        isDefault:         dto.isDefault         ?? false,
        isActive:          dto.isActive          ?? true,
      },
      include: SHIFT_INCLUDE,
    });
  }

  // ── Update ────────────────────────────────────────────────────────────────

  async update(id: number, dto: UpdateWorkingShiftDto) {
    const shift = await this.prisma.shift.findUnique({ where: { id } });
    if (!shift) throw new NotFoundException(`Working shift #${id} not found`);

    // Code clash check
    if (dto.code && dto.code !== shift.code) {
      const clash = await this.prisma.shift.findUnique({ where: { code: dto.code } });
      if (clash) throw new ConflictException(`Shift code "${dto.code}" is already in use`);
    }

    const newStart = dto.startTime ?? shift.startTime;
    const newEnd   = dto.endTime   ?? shift.endTime;

    if (newStart === newEnd) {
      throw new BadRequestException('startTime and endTime must not be equal');
    }

    const isCrossDay =
      dto.isCrossDay !== undefined
        ? dto.isCrossDay
        : (dto.startTime || dto.endTime)
          ? toMin(newEnd) < toMin(newStart)
          : shift.isCrossDay;

    const scopeId = dto.departmentId !== undefined ? dto.departmentId : shift.departmentId;
    await this.assertNoOverlap(newStart, newEnd, isCrossDay, scopeId ?? undefined, id);

    if (dto.isDefault) {
      await this.prisma.shift.updateMany({
        where: { isDefault: true, id: { not: id } },
        data: { isDefault: false },
      });
    }

    return this.prisma.shift.update({
      where: { id },
      data: {
        ...(dto.name              !== undefined && { name:              dto.name }),
        ...(dto.code              !== undefined && { code:              dto.code.toUpperCase() }),
        ...(dto.startTime         !== undefined && { startTime:         dto.startTime }),
        ...(dto.endTime           !== undefined && { endTime:           dto.endTime }),
        ...(dto.isCrossDay        !== undefined && { isCrossDay }),
        ...(dto.breakMinutes      !== undefined && { breakMinutes:      dto.breakMinutes }),
        ...(dto.graceLateMinutes  !== undefined && { graceLateMinutes:  dto.graceLateMinutes }),
        ...(dto.graceEarlyMinutes !== undefined && { graceEarlyMinutes: dto.graceEarlyMinutes }),
        ...(dto.departmentId      !== undefined && { departmentId:      dto.departmentId }),
        ...(dto.isDefault         !== undefined && { isDefault:         dto.isDefault }),
        ...(dto.isActive          !== undefined && { isActive:          dto.isActive }),
        // Re-compute isCrossDay if times changed
        ...(dto.startTime || dto.endTime ? { isCrossDay } : {}),
      },
      include: SHIFT_INCLUDE,
    });
  }

  // ── Delete ────────────────────────────────────────────────────────────────

  async delete(id: number) {
    const shift = await this.prisma.shift.findUnique({
      where: { id },
      include: { _count: { select: { currentEmployees: true } } },
    });
    if (!shift) throw new NotFoundException(`Working shift #${id} not found`);

    if (shift._count.currentEmployees > 0) {
      throw new BadRequestException(
        `Cannot delete shift "${shift.name}" — ${shift._count.currentEmployees} employee(s) are currently assigned to it.`,
      );
    }

    return this.prisma.shift.delete({ where: { id } });
  }

  // ── Helpers ───────────────────────────────────────────────────────────────

  /**
   * Checks that no existing shift within the same department scope (or global)
   * overlaps with the proposed [startTime, endTime].
   * @param excludeId - skip the shift being updated
   */
  private async assertNoOverlap(
    startTime: string,
    endTime:   string,
    isCrossDay: boolean,
    departmentId?: number,
    excludeId?: number,
  ) {
    const peers = await this.prisma.shift.findMany({
      where: {
        ...(departmentId !== undefined
          ? { departmentId }
          : { departmentId: null }),
        ...(excludeId !== undefined ? { id: { not: excludeId } } : {}),
        isActive: true,
      },
      select: { id: true, name: true, startTime: true, endTime: true, isCrossDay: true },
    });

    for (const peer of peers) {
      if (overlaps(startTime, endTime, isCrossDay, peer.startTime, peer.endTime, peer.isCrossDay)) {
        throw new ConflictException(
          `Time range ${startTime}–${endTime} overlaps with existing shift "${peer.name}" (${peer.startTime}–${peer.endTime}).`,
        );
      }
    }
  }
}

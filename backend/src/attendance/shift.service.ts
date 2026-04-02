import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateShiftDto } from './dto/create-shift.dto';

/** Convert "HH:MM" → total minutes from midnight */
export function hhmmToMinutes(hhmm: string): number {
  const [h, m] = hhmm.split(':').map(Number);
  return h * 60 + m;
}

@Injectable()
export class ShiftService {
  constructor(private readonly prisma: PrismaService) {}

  findAll() {
    return this.prisma.shift.findMany({ orderBy: { startTime: 'asc' } });
  }

  findDefault() {
    return this.prisma.shift.findFirst({ where: { isDefault: true } });
  }

  async create(dto: CreateShiftDto) {
    if (dto.isDefault) {
      // Un-set current default before setting a new one
      await this.prisma.shift.updateMany({
        where: { isDefault: true },
        data: { isDefault: false },
      });
    }
    return this.prisma.shift.create({
      data: {
        name: dto.name,
        startTime: dto.startTime,
        endTime: dto.endTime,
        breakMinutes: dto.breakMinutes ?? 60,
        graceLateMinutes: dto.graceLateMinutes ?? 15,
        graceEarlyMinutes: dto.graceEarlyMinutes ?? 15,
        isDefault: dto.isDefault ?? false,
      },
    });
  }

  async update(id: number, dto: Partial<CreateShiftDto>) {
    const shift = await this.prisma.shift.findUnique({ where: { id } });
    if (!shift) throw new NotFoundException(`Shift #${id} not found`);

    if (dto.isDefault) {
      await this.prisma.shift.updateMany({
        where: { isDefault: true, id: { not: id } },
        data: { isDefault: false },
      });
    }

    return this.prisma.shift.update({ where: { id }, data: dto });
  }

  /**
   * Auto-detect the best shift for a given local time.
   * Searches within a ±90-minute window around each shift's start time.
   * Falls back to the default shift, then the first shift in the list.
   */
  async detectShift(now: Date): Promise<Awaited<ReturnType<typeof this.findAll>>[number] | null> {
    const shifts = await this.findAll();
    if (!shifts.length) return null;

    const currentMin = now.getHours() * 60 + now.getMinutes();

    const candidates = shifts.filter((s) => {
      const start = hhmmToMinutes(s.startTime);
      const end = hhmmToMinutes(s.endTime);
      // Window: 1h before shift start → 2h after shift end
      return currentMin >= start - 60 && currentMin <= end + 120;
    });

    if (candidates.length === 1) return candidates[0];
    if (candidates.length > 1) {
      // Closest start time wins
      return candidates.reduce((best, s) => {
        const d1 = Math.abs(hhmmToMinutes(best.startTime) - currentMin);
        const d2 = Math.abs(hhmmToMinutes(s.startTime) - currentMin);
        return d2 < d1 ? s : best;
      });
    }

    return shifts.find((s) => s.isDefault) ?? shifts[0];
  }
}

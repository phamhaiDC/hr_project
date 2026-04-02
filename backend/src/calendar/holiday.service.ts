import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateHolidayDto } from './dto/create-holiday.dto';

@Injectable()
export class HolidayService {
  constructor(private readonly prisma: PrismaService) {}

  // ── List ──────────────────────────────────────────────────────────────────

  /** Return all holidays. Pass `year` to include only holidays that overlap that year. */
  async findAll(year?: number) {
    if (!year) {
      return this.prisma.holiday.findMany({ orderBy: { fromDate: 'asc' } });
    }

    const yearStart = new Date(Date.UTC(year, 0, 1));
    const yearEnd = new Date(Date.UTC(year, 11, 31));

    return this.prisma.holiday.findMany({
      where: {
        OR: [
          // holidays that fall within this year
          { fromDate: { lte: yearEnd }, toDate: { gte: yearStart } },
          // recurring holidays apply every year
          { isRecurring: true },
        ],
      },
      orderBy: { fromDate: 'asc' },
    });
  }

  findOne(id: number) {
    return this.prisma.holiday.findUnique({ where: { id } });
  }

  // ── Create ────────────────────────────────────────────────────────────────

  create(dto: CreateHolidayDto) {
    return this.prisma.holiday.create({
      data: {
        name: dto.name,
        fromDate: new Date(dto.fromDate),
        toDate: new Date(dto.toDate),
        isPaid: dto.isPaid ?? true,
        isRecurring: dto.isRecurring ?? false,
        description: dto.description,
      },
    });
  }

  // ── Update ────────────────────────────────────────────────────────────────

  async update(id: number, dto: Partial<CreateHolidayDto>) {
    const holiday = await this.findOne(id);
    if (!holiday) throw new NotFoundException(`Holiday #${id} not found`);

    return this.prisma.holiday.update({
      where: { id },
      data: {
        ...(dto.name && { name: dto.name }),
        ...(dto.fromDate && { fromDate: new Date(dto.fromDate) }),
        ...(dto.toDate && { toDate: new Date(dto.toDate) }),
        ...(dto.isPaid !== undefined && { isPaid: dto.isPaid }),
        ...(dto.isRecurring !== undefined && { isRecurring: dto.isRecurring }),
        ...(dto.description !== undefined && { description: dto.description }),
      },
    });
  }

  // ── Delete ────────────────────────────────────────────────────────────────

  async remove(id: number) {
    const holiday = await this.findOne(id);
    if (!holiday) throw new NotFoundException(`Holiday #${id} not found`);
    await this.prisma.holiday.delete({ where: { id } });
    return { message: `Holiday "${holiday.name}" deleted` };
  }

  // ── Helper: expand holiday date ranges into a Set of "YYYY-MM-DD" strings ─

  /**
   * For a given target year, returns a Map<dateStr, { name, isPaid }>
   * covering every date that is a holiday (including recurring ones projected
   * into the target year).
   */
  async buildHolidayMap(year: number): Promise<Map<string, { name: string; isPaid: boolean }>> {
    const holidays = await this.findAll(year);
    const map = new Map<string, { name: string; isPaid: boolean }>();

    for (const holiday of holidays) {
      let from = new Date(holiday.fromDate);
      let to = new Date(holiday.toDate);

      // Project recurring holidays into the target year
      if (holiday.isRecurring) {
        from = new Date(Date.UTC(year, from.getUTCMonth(), from.getUTCDate()));
        to = new Date(Date.UTC(year, to.getUTCMonth(), to.getUTCDate()));
      }

      // Iterate each day in the range
      const cursor = new Date(from);
      while (cursor <= to) {
        const key = cursor.toISOString().split('T')[0];
        map.set(key, { name: holiday.name, isPaid: holiday.isPaid });
        cursor.setUTCDate(cursor.getUTCDate() + 1);
      }
    }

    return map;
  }
}

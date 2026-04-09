import {
  Injectable,
  NotFoundException,
  ConflictException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { HolidayService } from './holiday.service';
import { CreateCalendarYearDto } from './dto/create-calendar-year.dto';
import { UpdateCalendarDayDto } from './dto/update-calendar-day.dto';

export type DayType = 'WORKING' | 'WEEKEND' | 'HOLIDAY' | 'COMPENSATION';

export interface DayInfo {
  date: string;       // "YYYY-MM-DD"
  type: DayType;
  isPaid: boolean;
  note?: string | null;
  isWorkingDay: boolean;
}

@Injectable()
export class CalendarService {
  private readonly logger = new Logger(CalendarService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly holidayService: HolidayService,
  ) {}

  // ── Year config ───────────────────────────────────────────────────────────

  listYears() {
    return this.prisma.calendarYear.findMany({
      orderBy: { year: 'desc' },
    });
  }

  async getYear(year: number) {
    const config = await this.prisma.calendarYear.findUnique({ where: { year } });
    if (!config) throw new NotFoundException(`CalendarYear ${year} not configured`);
    return config;
  }

  async createYear(dto: CreateCalendarYearDto) {
    const existing = await this.prisma.calendarYear.findUnique({ where: { year: dto.year } });
    if (existing) throw new ConflictException(`CalendarYear ${dto.year} already exists`);

    const config = await this.prisma.calendarYear.create({
      data: {
        year: dto.year,
        weekendDays: dto.weekendDays,
        country: dto.country,
        description: dto.description,
      },
    });

    if (dto.autoGenerate) {
      await this.generate(dto.year);
    }

    return config;
  }

  async updateYear(year: number, dto: Partial<CreateCalendarYearDto>) {
    await this.getYear(year);
    return this.prisma.calendarYear.update({
      where: { year },
      data: {
        ...(dto.weekendDays && { weekendDays: dto.weekendDays }),
        ...(dto.country !== undefined && { country: dto.country }),
        ...(dto.description !== undefined && { description: dto.description }),
      },
    });
  }

  // ── Day queries ───────────────────────────────────────────────────────────

  /** Get all days for a year (and optionally a specific month, 1-12). */
  async getDays(year: number, month?: number) {
    const where: any = { year };

    if (month) {
      const start = new Date(Date.UTC(year, month - 1, 1));
      const end = new Date(Date.UTC(year, month, 0));
      where.date = { gte: start, lte: end };
    }

    return this.prisma.calendarDay.findMany({
      where,
      orderBy: { date: 'asc' },
    });
  }

  /** Get a single day by ISO date string. Returns null if not generated yet. */
  async getDay(dateStr: string): Promise<DayInfo | null> {
    const date = new Date(dateStr);
    const record = await this.prisma.calendarDay.findUnique({ where: { date } });

    if (!record) return null;

    return {
      date: dateStr,
      type: record.type as DayType,
      isPaid: record.isPaid,
      note: record.note,
      isWorkingDay: record.type === 'WORKING' || record.type === 'COMPENSATION',
    };
  }

  /**
   * Quick calendar check — returns day info without throwing if year not generated.
   * Falls back to a best-effort calculation from weekendDays config + holidays.
   */
  async checkDay(dateStr: string): Promise<DayInfo> {
    const stored = await this.getDay(dateStr);
    if (stored) return stored;

    // Fallback: compute on-the-fly
    const date = new Date(dateStr);
    const year = date.getUTCFullYear();
    const config = await this.prisma.calendarYear.findUnique({ where: { year } });
    const weekendDays = config?.weekendDays ?? [0, 6];

    const holidayMap = await this.holidayService.buildHolidayMap(year);
    const holidayInfo = holidayMap.get(dateStr);

    const dow = date.getUTCDay(); // 0=Sun … 6=Sat
    let type: DayType = 'WORKING';
    let isPaid = true;

    if (holidayInfo) {
      type = 'HOLIDAY';
      isPaid = holidayInfo.isPaid;
    } else if (weekendDays.includes(dow)) {
      type = 'WEEKEND';
      isPaid = false;
    }

    return {
      date: dateStr,
      type,
      isPaid,
      note: holidayInfo?.name ?? null,
      isWorkingDay: type === 'WORKING',
    };
  }

  // ── Day override ──────────────────────────────────────────────────────────

  /** Manually override a single CalendarDay (e.g. mark as COMPENSATION). */
  async updateDay(dateStr: string, dto: UpdateCalendarDayDto) {
    const date = new Date(dateStr);
    const year = date.getUTCFullYear();

    // Ensure year config exists
    const config = await this.prisma.calendarYear.findUnique({ where: { year } });
    if (!config) throw new NotFoundException(`CalendarYear ${year} is not configured`);

    return this.prisma.calendarDay.upsert({
      where: { date },
      create: {
        year,
        date,
        type: dto.type,
        isPaid: dto.isPaid ?? dto.type !== 'WEEKEND',
        note: dto.note,
      },
      update: {
        type: dto.type,
        ...(dto.isPaid !== undefined && { isPaid: dto.isPaid }),
        ...(dto.note !== undefined && { note: dto.note }),
      },
    });
  }

  // ── Generation ────────────────────────────────────────────────────────────

  /**
   * Generate or regenerate CalendarDay rows for an entire year.
   *
   * Rules applied in order:
   *  1. Holiday (from Holiday table)  → type = HOLIDAY, isPaid = holiday.isPaid
   *  2. Weekend (from CalendarYear.weekendDays) → type = WEEKEND, isPaid = false
   *  3. Everything else               → type = WORKING, isPaid = true
   *
   * Existing rows are upserted (overwritten) except those with type = COMPENSATION,
   * which are manually managed and always preserved.
   */
  async generate(year: number): Promise<{ generated: number; skipped: number }> {
    const config = await this.getYear(year);
    const weekendDays = config.weekendDays;

    // Build holiday coverage map for the year
    const holidayMap = await this.holidayService.buildHolidayMap(year);

    // Fetch existing COMPENSATION overrides so we can preserve them
    const compensationDates = new Set(
      (await this.prisma.calendarDay.findMany({ where: { year, type: 'COMPENSATION' } }))
        .map((d) => d.date.toISOString().split('T')[0]),
    );

    let generated = 0;
    let skipped = 0;

    // Iterate every day of the year
    const cursor = new Date(Date.UTC(year, 0, 1));
    const yearEnd = new Date(Date.UTC(year, 11, 31));

    while (cursor <= yearEnd) {
      const dateStr = cursor.toISOString().split('T')[0];

      // Preserve manually set COMPENSATION days
      if (compensationDates.has(dateStr)) {
        skipped++;
        cursor.setUTCDate(cursor.getUTCDate() + 1);
        continue;
      }

      const dow = cursor.getUTCDay();
      const holidayInfo = holidayMap.get(dateStr);

      let type: DayType = 'WORKING';
      let isPaid = true;
      let note: string | null = null;

      if (holidayInfo) {
        type = 'HOLIDAY';
        isPaid = holidayInfo.isPaid;
        note = holidayInfo.name;
      } else if (weekendDays.includes(dow)) {
        type = 'WEEKEND';
        isPaid = false;
      }

      const date = new Date(Date.UTC(year, cursor.getUTCMonth(), cursor.getUTCDate()));

      await this.prisma.calendarDay.upsert({
        where: { date },
        create: { year, date, type, isPaid, note },
        update: { type, isPaid, note },
      });

      generated++;
      cursor.setUTCDate(cursor.getUTCDate() + 1);
    }

    this.logger.log(`Generated ${generated} days for ${year} (${skipped} COMPENSATION days preserved)`);
    return { generated, skipped };
  }

  // ── Summary ───────────────────────────────────────────────────────────────

  /** Count days by type for a given year (useful for leave policy calculations). */
  async getSummary(year: number) {
    const days = await this.prisma.calendarDay.findMany({ where: { year } });
    const summary = { WORKING: 0, WEEKEND: 0, HOLIDAY: 0, COMPENSATION: 0, total: days.length };
    for (const d of days) summary[d.type as keyof typeof summary]++;
    return { year, ...summary };
  }
}

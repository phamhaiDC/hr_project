import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { PrismaService } from '../prisma/prisma.service';

/** Round to 2 decimal places */
function toHours(ms: number): number {
  return parseFloat((ms / 1000 / 60 / 60).toFixed(2));
}

/** Return midnight of a given date in UTC */
function toDateOnly(ts: Date): Date {
  return new Date(Date.UTC(ts.getUTCFullYear(), ts.getUTCMonth(), ts.getUTCDate()));
}

@Injectable()
export class AttendanceProcessorService {
  private readonly logger = new Logger(AttendanceProcessorService.name);

  constructor(private readonly prisma: PrismaService) {}

  // ─── Cron: every day at 01:00 (server timezone) ──────────────────────────

  @Cron('0 1 * * *', { name: 'process-attendance' })
  async runDailyJob(): Promise<void> {
    this.logger.log('Daily attendance processing started');
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const result = await this.processDate(toDateOnly(yesterday));
    this.logger.log(
      `Done — ${result.processed} records upserted, ${result.skipped} employees skipped`,
    );
  }

  // ─── Core: process one calendar date ─────────────────────────────────────

  /**
   * Reads all AttendanceRaw rows for the given date, resolves codes → IDs,
   * groups by employee, picks first/last timestamp, then upserts Attendance.
   */
  async processDate(date: Date): Promise<{ processed: number; skipped: number }> {
    const dayStart = toDateOnly(date);
    const dayEnd = new Date(dayStart.getTime() + 24 * 60 * 60 * 1000 - 1);

    const rawRows = await this.prisma.attendanceRaw.findMany({
      where: { timestamp: { gte: dayStart, lte: dayEnd } },
      orderBy: { timestamp: 'asc' },
    });

    if (rawRows.length === 0) return { processed: 0, skipped: 0 };

    // Resolve employee codes → IDs in one query
    const codes = [...new Set(
      rawRows.map((r) => r.employeeCode).filter((c): c is string => !!c),
    )];

    const employees = await this.prisma.employee.findMany({
      where: { code: { in: codes } },
      select: { id: true, code: true },
    });

    const codeToId = new Map(employees.map((e) => [e.code as string, e.id]));

    // Group timestamps by employee ID
    const grouped = new Map<number, Date[]>();
    let skipped = 0;

    for (const row of rawRows) {
      if (!row.employeeCode || !row.timestamp) continue;
      const empId = codeToId.get(row.employeeCode);
      if (!empId) { skipped++; continue; }

      const list = grouped.get(empId) ?? [];
      list.push(row.timestamp);
      grouped.set(empId, list);
    }

    // Upsert one Attendance row per (employee, date)
    let processed = 0;

    for (const [employeeId, timestamps] of grouped) {
      const sorted = [...timestamps].sort((a, b) => a.getTime() - b.getTime());
      const checkinTime = sorted[0];
      const checkoutTime = sorted[sorted.length - 1];
      const workingHours =
        sorted.length > 1 ? toHours(checkoutTime.getTime() - checkinTime.getTime()) : 0;

      await this.prisma.attendance.upsert({
        where: { employeeId_date: { employeeId, date: dayStart } },
        update: { checkinTime, checkoutTime, workingHours },
        create: { employeeId, date: dayStart, checkinTime, checkoutTime, workingHours },
      });

      processed++;
    }

    return { processed, skipped };
  }

  /** Process multiple distinct dates — called after a bulk import. */
  async processDates(dates: Date[]): Promise<{ processed: number; skipped: number }> {
    const unique = [...new Set(dates.map((d) => toDateOnly(d).getTime()))].map(
      (t) => new Date(t),
    );
    let processed = 0;
    let skipped = 0;
    for (const d of unique) {
      const r = await this.processDate(d);
      processed += r.processed;
      skipped += r.skipped;
    }
    return { processed, skipped };
  }
}

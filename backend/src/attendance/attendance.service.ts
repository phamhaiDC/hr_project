import { Injectable, BadRequestException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { PaginationDto, paginate, buildPaginatedResponse } from '../common/dto/pagination.dto';
import { ImportAttendanceDto } from './dto/import-attendance.dto';
import { ReportAttendanceDto } from './dto/report-attendance.dto';
import { CheckInDto } from './dto/check-in.dto';
import { CheckOutDto } from './dto/check-out.dto';
import { ShiftService, hhmmToMinutes } from './shift.service';
import { LocationService } from './location.service';
import { CalendarService } from '../calendar/calendar.service';

const ATTENDANCE_EMPLOYEE_SELECT = {
  id: true,
  code: true,
  fullName: true,
  email: true,
  department: { select: { id: true, name: true } },
  position: { select: { id: true, name: true } },
};

@Injectable()
export class AttendanceService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly shiftService: ShiftService,
    private readonly locationService: LocationService,
    private readonly calendarService: CalendarService,
  ) {}

  // ─── Manual check-in / check-out ─────────────────────────────────────────

  async checkInOut(employeeId: number, type: 'check_in' | 'check_out', timestamp?: string) {
    const ts = timestamp ? new Date(timestamp) : new Date();
    const dateOnly = new Date(Date.UTC(ts.getUTCFullYear(), ts.getUTCMonth(), ts.getUTCDate()));

    let attendance = await this.prisma.attendance.findFirst({
      where: { employeeId, date: dateOnly },
    });

    if (type === 'check_in') {
      if (attendance?.checkinTime) {
        throw new BadRequestException('Already checked in today');
      }
      if (!attendance) {
        attendance = await this.prisma.attendance.create({
          data: { employeeId, date: dateOnly, checkinTime: ts },
        });
      } else {
        attendance = await this.prisma.attendance.update({
          where: { id: attendance.id },
          data: { checkinTime: ts },
        });
      }
    } else {
      if (!attendance?.checkinTime) {
        throw new BadRequestException('Must check in before checking out');
      }
      if (attendance.checkoutTime) {
        throw new BadRequestException('Already checked out today');
      }

      const diffMs = ts.getTime() - attendance.checkinTime.getTime();
      const workingHours = parseFloat((diffMs / 1000 / 60 / 60).toFixed(2));

      attendance = await this.prisma.attendance.update({
        where: { id: attendance.id },
        data: { checkoutTime: ts, workingHours },
      });
    }

    return attendance;
  }

  // ─── Raw import ───────────────────────────────────────────────────────────

  /**
   * Bulk-save raw timestamps from an access device.
   * Validates employee codes, inserts into AttendanceRaw, and returns the
   * distinct dates so the caller can immediately trigger processing.
   */
  async importRaw(dto: ImportAttendanceDto): Promise<{
    imported: number;
    unknownCodes: string[];
    dates: Date[];
  }> {
    const codes = [...new Set(dto.records.map((r) => r.employeeCode))];

    const employees = await this.prisma.employee.findMany({
      where: { code: { in: codes } },
      select: { code: true },
    });

    const knownCodes = new Set(employees.map((e) => e.code as string));
    const unknownCodes = codes.filter((c) => !knownCodes.has(c));

    const validRecords = dto.records.filter((r) => knownCodes.has(r.employeeCode));

    if (validRecords.length === 0) {
      throw new BadRequestException(
        `No valid records to import. Unknown employee codes: ${unknownCodes.join(', ')}`,
      );
    }

    await this.prisma.attendanceRaw.createMany({
      data: validRecords.map((r) => ({
        employeeCode: r.employeeCode,
        timestamp: new Date(r.timestamp),
      })),
    });

    const dateSet = new Set(
      validRecords.map((r) => {
        const ts = new Date(r.timestamp);
        return Date.UTC(ts.getUTCFullYear(), ts.getUTCMonth(), ts.getUTCDate());
      }),
    );
    const dates = [...dateSet].map((t) => new Date(t));

    return { imported: validRecords.length, unknownCodes, dates };
  }

  // ─── Report ───────────────────────────────────────────────────────────────

  async getReport(dto: ReportAttendanceDto) {
    const { page = 1, limit = 20, employeeId, departmentId, dateFrom, dateTo } = dto;
    const { skip, take } = paginate(page, limit);

    const where: any = {};

    if (employeeId) where.employeeId = employeeId;
    if (departmentId) where.employee = { departmentId };
    if (dateFrom || dateTo) {
      where.date = {};
      if (dateFrom) where.date.gte = new Date(dateFrom);
      if (dateTo) where.date.lte = new Date(dateTo);
    }

    const [data, total] = await this.prisma.$transaction([
      this.prisma.attendance.findMany({
        where,
        include: { employee: { select: ATTENDANCE_EMPLOYEE_SELECT } },
        skip,
        take,
        orderBy: [{ date: 'desc' }, { employeeId: 'asc' }],
      }),
      this.prisma.attendance.count({ where }),
    ]);

    const totalWorkingHours = data.reduce(
      (sum, r) => sum + (r.workingHours ? Number(r.workingHours) : 0),
      0,
    );

    return {
      ...buildPaginatedResponse(data, total, page, limit),
      summary: {
        totalRecords: total,
        totalWorkingHours: parseFloat(totalWorkingHours.toFixed(2)),
      },
    };
  }

  // ─── Queries ──────────────────────────────────────────────────────────────

  async findAll(query: PaginationDto & { employeeId?: number; date?: string }) {
    const { page = 1, limit = 20, employeeId, date } = query;
    const { skip, take } = paginate(page, limit);

    const where: any = {};
    if (employeeId) where.employeeId = employeeId;
    if (date) where.date = new Date(date);

    const [data, total] = await this.prisma.$transaction([
      this.prisma.attendance.findMany({
        where,
        include: { employee: { select: ATTENDANCE_EMPLOYEE_SELECT } },
        skip,
        take,
        orderBy: { date: 'desc' },
      }),
      this.prisma.attendance.count({ where }),
    ]);

    return buildPaginatedResponse(data, total, page, limit);
  }

  async findTodayStatus(employeeId: number) {
    const now = new Date();
    const today = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
    const todayStr = today.toISOString().split('T')[0];

    const [attendance, dayInfo] = await Promise.all([
      this.prisma.attendance.findFirst({
        where: { employeeId, date: today },
        include: { shift: true },
      }),
      this.calendarService.checkDay(todayStr),
    ]);

    return {
      date: today,
      attendance: attendance ?? null,
      checkedIn: !!attendance?.checkinTime,
      checkedOut: !!attendance?.checkoutTime,
      dayInfo,
    };
  }

  async getSummary(employeeId: number, month: number, year: number) {
    const start = new Date(Date.UTC(year, month - 1, 1));
    const end = new Date(Date.UTC(year, month, 0));

    const records = await this.prisma.attendance.findMany({
      where: { employeeId, date: { gte: start, lte: end } },
      orderBy: { date: 'asc' },
    });

    const totalWorkingHours = records.reduce(
      (acc, r) => acc + (r.workingHours ? Number(r.workingHours) : 0),
      0,
    );

    return {
      employeeId,
      month,
      year,
      totalDays: records.length,
      totalWorkingHours: parseFloat(totalWorkingHours.toFixed(2)),
      records,
    };
  }

  // ─── WFM: Check-in ────────────────────────────────────────────────────────

  async checkIn(employeeId: number, dto: CheckInDto) {
    const ts = dto.timestamp ? new Date(dto.timestamp) : new Date();
    const dateOnly = new Date(Date.UTC(ts.getUTCFullYear(), ts.getUTCMonth(), ts.getUTCDate()));
    const dateStr = dateOnly.toISOString().split('T')[0];

    // Prevent double check-in
    const existing = await this.prisma.attendance.findFirst({
      where: { employeeId, date: dateOnly },
    });
    if (existing?.checkinTime) {
      throw new BadRequestException('Already checked in today');
    }

    // Calendar context (non-blocking — employees may work on holidays/weekends)
    const dayInfo = await this.calendarService.checkDay(dateStr);

    // GPS validation (optional – only enforced when locations exist and GPS provided)
    let resolvedLocationId: number | undefined;
    let distanceM: number | undefined;

    if (dto.lat != null && dto.lng != null) {
      const nearest = await this.locationService.findNearest(dto.lat, dto.lng);
      if (nearest) {
        distanceM = nearest.distanceM;
        if (!nearest.withinRadius) {
          throw new ForbiddenException(
            `You are ${nearest.distanceM}m from "${nearest.name}" (allowed radius: check location settings). Move closer to check in.`,
          );
        }
        resolvedLocationId = nearest.locationId;
      }
    }

    // Auto-detect shift
    const shift = await this.shiftService.detectShift(ts);
    const shiftId = shift?.id ?? undefined;

    // Determine if late
    let isLate = false;
    if (shift) {
      const checkinMin = ts.getHours() * 60 + ts.getMinutes();
      const startMin = hhmmToMinutes(shift.startTime);
      isLate = checkinMin > startMin + shift.graceLateMinutes;
    }

    // Upsert attendance row
    const attendance = existing
      ? await this.prisma.attendance.update({
          where: { id: existing.id },
          data: {
            checkinTime: ts,
            shiftId,
            isLate,
            checkinLat: dto.lat,
            checkinLng: dto.lng,
          },
        })
      : await this.prisma.attendance.create({
          data: {
            employeeId,
            date: dateOnly,
            checkinTime: ts,
            shiftId,
            isLate,
            checkinLat: dto.lat,
            checkinLng: dto.lng,
          },
        });

    // Write audit log entry
    await this.prisma.attendanceLog.create({
      data: {
        employeeId,
        time: ts,
        type: 'check_in',
        lat: dto.lat,
        lng: dto.lng,
        locationId: resolvedLocationId,
        deviceId: dto.deviceId,
        distanceM,
        attendanceId: attendance.id,
      },
    });

    return {
      attendance,
      isLate,
      dayInfo,
      shift: shift ? { name: shift.name, startTime: shift.startTime, endTime: shift.endTime } : null,
      location: resolvedLocationId ? { id: resolvedLocationId, distanceM } : null,
    };
  }

  // ─── WFM: Check-out ───────────────────────────────────────────────────────

  async checkOut(employeeId: number, dto: CheckOutDto) {
    const ts = dto.timestamp ? new Date(dto.timestamp) : new Date();
    const dateOnly = new Date(Date.UTC(ts.getUTCFullYear(), ts.getUTCMonth(), ts.getUTCDate()));

    const attendance = await this.prisma.attendance.findFirst({
      where: { employeeId, date: dateOnly },
      include: { shift: true },
    });

    if (!attendance?.checkinTime) {
      throw new BadRequestException('Must check in before checking out');
    }
    if (attendance.checkoutTime) {
      throw new BadRequestException('Already checked out today');
    }

    // GPS validation
    let resolvedLocationId: number | undefined;
    let distanceM: number | undefined;

    if (dto.lat != null && dto.lng != null) {
      const nearest = await this.locationService.findNearest(dto.lat, dto.lng);
      if (nearest) {
        distanceM = nearest.distanceM;
        // Allow check-out even outside radius (employee may have left the building)
        resolvedLocationId = nearest.locationId;
      }
    }

    // Calculate working hours
    const diffMs = ts.getTime() - attendance.checkinTime.getTime();
    const workingHours = parseFloat((diffMs / 1000 / 3600).toFixed(2));

    // WFM status flags
    let isEarlyOut = false;
    let isOvertime = false;
    let overtimeHours: number | undefined;

    if (attendance.shift) {
      const checkoutMin = ts.getHours() * 60 + ts.getMinutes();
      const endMin = hhmmToMinutes(attendance.shift.endTime);
      const startMin = hhmmToMinutes(attendance.shift.startTime);

      isEarlyOut = checkoutMin < endMin - attendance.shift.graceEarlyMinutes;

      const normalHours = (endMin - startMin - attendance.shift.breakMinutes) / 60;
      if (workingHours > normalHours) {
        isOvertime = true;
        overtimeHours = parseFloat((workingHours - normalHours).toFixed(2));
      }
    }

    const updated = await this.prisma.attendance.update({
      where: { id: attendance.id },
      data: {
        checkoutTime: ts,
        workingHours,
        isEarlyOut,
        isOvertime,
        overtimeHours,
        checkoutLat: dto.lat,
        checkoutLng: dto.lng,
      },
    });

    await this.prisma.attendanceLog.create({
      data: {
        employeeId,
        time: ts,
        type: 'check_out',
        lat: dto.lat,
        lng: dto.lng,
        locationId: resolvedLocationId,
        deviceId: dto.deviceId,
        distanceM,
        attendanceId: attendance.id,
      },
    });

    return {
      attendance: updated,
      workingHours,
      isEarlyOut,
      isOvertime,
      overtimeHours: overtimeHours ?? 0,
    };
  }

  // ─── WFM: My records ──────────────────────────────────────────────────────

  async getMyRecords(
    employeeId: number,
    query: PaginationDto & { dateFrom?: string; dateTo?: string },
  ) {
    const { page = 1, limit = 20, dateFrom, dateTo } = query;
    const { skip, take } = paginate(page, limit);

    const where: any = { employeeId };
    if (dateFrom || dateTo) {
      where.date = {};
      if (dateFrom) where.date.gte = new Date(dateFrom);
      if (dateTo) where.date.lte = new Date(dateTo);
    }

    const [data, total] = await this.prisma.$transaction([
      this.prisma.attendance.findMany({
        where,
        include: { shift: true },
        skip,
        take,
        orderBy: { date: 'desc' },
      }),
      this.prisma.attendance.count({ where }),
    ]);

    return buildPaginatedResponse(data, total, page, limit);
  }
}

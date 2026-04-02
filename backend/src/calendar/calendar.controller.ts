import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  ParseIntPipe,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiQuery,
  ApiParam,
} from '@nestjs/swagger';
import { CalendarService } from './calendar.service';
import { HolidayService } from './holiday.service';
import { CreateCalendarYearDto } from './dto/create-calendar-year.dto';
import { UpdateCalendarDayDto } from './dto/update-calendar-day.dto';
import { CreateHolidayDto } from './dto/create-holiday.dto';
import { Roles } from '../common/decorators/roles.decorator';

@ApiTags('Calendar')
@ApiBearerAuth('JWT-auth')
@Controller('calendar')
export class CalendarController {
  constructor(
    private readonly calendarService: CalendarService,
    private readonly holidayService: HolidayService,
  ) {}

  // ══ Year config ═══════════════════════════════════════════════════════════

  @Get('years')
  @ApiOperation({ summary: 'List all configured calendar years' })
  listYears() {
    return this.calendarService.listYears();
  }

  @Post('years')
  @Roles('admin', 'hr')
  @ApiOperation({
    summary: 'Configure a calendar year (admin, hr)',
    description: 'Create weekend-day config for a year. Set autoGenerate=true to immediately generate all CalendarDay rows.',
  })
  createYear(@Body() dto: CreateCalendarYearDto) {
    return this.calendarService.createYear(dto);
  }

  @Patch('years/:year')
  @Roles('admin', 'hr')
  @ApiOperation({ summary: 'Update calendar year config (admin, hr)' })
  @ApiParam({ name: 'year', type: Number, example: 2025 })
  updateYear(
    @Param('year', ParseIntPipe) year: number,
    @Body() dto: Partial<CreateCalendarYearDto>,
  ) {
    return this.calendarService.updateYear(year, dto);
  }

  // ══ Generate ═══════════════════════════════════════════════════════════════

  @Post('years/:year/generate')
  @Roles('admin', 'hr')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Generate CalendarDay rows for a year (admin, hr)',
    description:
      'Populates every day of the year as WORKING, WEEKEND, or HOLIDAY based on ' +
      "the year's weekendDays config and the Holiday table. " +
      'Existing COMPENSATION days are preserved.',
  })
  @ApiParam({ name: 'year', type: Number, example: 2025 })
  generate(@Param('year', ParseIntPipe) year: number) {
    return this.calendarService.generate(year);
  }

  // ══ Summary ════════════════════════════════════════════════════════════════

  @Get('summary')
  @ApiOperation({ summary: 'Working/weekend/holiday counts for a year' })
  @ApiQuery({ name: 'year', type: Number, required: false })
  getSummary(@Query('year') year?: number) {
    const y = year ? Number(year) : new Date().getFullYear();
    return this.calendarService.getSummary(y);
  }

  // ══ Day queries ════════════════════════════════════════════════════════════

  /**
   * GET /calendar
   * Returns CalendarDay rows for a year (+ optional month filter).
   */
  @Get()
  @ApiOperation({ summary: 'Get calendar days for a year (+ optional month filter)' })
  @ApiQuery({ name: 'year', type: Number, required: false, example: 2025 })
  @ApiQuery({ name: 'month', type: Number, required: false, example: 6 })
  getDays(
    @Query('year') year?: number,
    @Query('month') month?: number,
  ) {
    const y = year ? Number(year) : new Date().getFullYear();
    const m = month ? Number(month) : undefined;
    return this.calendarService.getDays(y, m);
  }

  @Get('check')
  @ApiOperation({
    summary: 'Quick check: get type info for a date',
    description: 'Returns type (WORKING/WEEKEND/HOLIDAY/COMPENSATION) and isPaid. ' +
      'Falls back to a computed result if the year has not been generated.',
  })
  @ApiQuery({ name: 'date', type: String, required: true, example: '2025-01-01' })
  checkDay(@Query('date') date: string) {
    return this.calendarService.checkDay(date);
  }

  @Get('day/:date')
  @ApiOperation({ summary: 'Get stored CalendarDay by date (null if not generated)' })
  @ApiParam({ name: 'date', example: '2025-01-01' })
  getDay(@Param('date') date: string) {
    return this.calendarService.getDay(date);
  }

  @Patch('day/:date')
  @Roles('admin', 'hr')
  @ApiOperation({
    summary: 'Override a single day (admin, hr)',
    description:
      'Use to mark a day as COMPENSATION (makeup working day), set a manual HOLIDAY, etc.',
  })
  @ApiParam({ name: 'date', example: '2025-02-08' })
  updateDay(
    @Param('date') date: string,
    @Body() dto: UpdateCalendarDayDto,
  ) {
    return this.calendarService.updateDay(date, dto);
  }

  // ══ Holidays ═══════════════════════════════════════════════════════════════

  @Get('holiday')
  @ApiOperation({ summary: 'List holidays (optionally filtered by year)' })
  @ApiQuery({ name: 'year', type: Number, required: false, example: 2025 })
  getHolidays(@Query('year', new ParseIntPipe({ optional: true })) year?: number) {
    return this.holidayService.findAll(year);
  }

  @Post('holiday')
  @Roles('admin', 'hr')
  @ApiOperation({ summary: 'Create a holiday (admin, hr)' })
  createHoliday(@Body() dto: CreateHolidayDto) {
    return this.holidayService.create(dto);
  }

  @Patch('holiday/:id')
  @Roles('admin', 'hr')
  @ApiOperation({ summary: 'Update a holiday (admin, hr)' })
  @ApiParam({ name: 'id', type: Number })
  updateHoliday(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: Partial<CreateHolidayDto>,
  ) {
    return this.holidayService.update(id, dto);
  }

  @Delete('holiday/:id')
  @Roles('admin', 'hr')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete a holiday (admin, hr)' })
  @ApiParam({ name: 'id', type: Number })
  deleteHoliday(@Param('id', ParseIntPipe) id: number) {
    return this.holidayService.remove(id);
  }
}

// ─── Standalone /holiday top-level alias ─────────────────────────────────────
// Keeps backward compat with the requirement: GET /holiday, POST /holiday

@ApiTags('Holiday')
@ApiBearerAuth('JWT-auth')
@Controller('holiday')
export class HolidayController {
  constructor(private readonly holidayService: HolidayService) {}

  @Get()
  @ApiOperation({ summary: 'List all holidays (optionally filtered by year)' })
  @ApiQuery({ name: 'year', type: Number, required: false })
  findAll(@Query('year', new ParseIntPipe({ optional: true })) year?: number) {
    return this.holidayService.findAll(year);
  }

  @Post()
  @Roles('admin', 'hr')
  @ApiOperation({ summary: 'Create a holiday (admin, hr)' })
  create(@Body() dto: CreateHolidayDto) {
    return this.holidayService.create(dto);
  }

  @Patch(':id')
  @Roles('admin', 'hr')
  @ApiOperation({ summary: 'Update a holiday (admin, hr)' })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: Partial<CreateHolidayDto>,
  ) {
    return this.holidayService.update(id, dto);
  }

  @Delete(':id')
  @Roles('admin', 'hr')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete a holiday (admin, hr)' })
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.holidayService.remove(id);
  }
}

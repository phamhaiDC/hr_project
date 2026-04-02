import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Query,
  ParseIntPipe,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiParam, ApiQuery } from '@nestjs/swagger';
import { OffboardingService } from './offboarding.service';
import { OffboardingApprovalService } from './offboarding-approval.service';
import { CreateResignationDto } from './dto/create-resignation.dto';
import { CreateChecklistItemDto } from './dto/create-checklist-item.dto';
import { ApproveResignationDto } from './dto/approve-resignation.dto';
import { PaginationDto } from '../common/dto/pagination.dto';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@ApiTags('Offboarding')
@ApiBearerAuth('JWT-auth')
@Controller('resignation')
export class OffboardingController {
  constructor(
    private readonly offboardingService: OffboardingService,
    private readonly approvalService: OffboardingApprovalService,
  ) {}

  // ── POST /resignation ─────────────────────────────────────────────────────

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Submit a resignation request',
    description:
      'Step 1 is pre-assigned to the direct manager. Step 2 is open to any HR user. ' +
      'On full approval the employee status is automatically set to "resigned" and a ' +
      'default offboarding checklist is generated.',
  })
  submitResignation(
    @Body() dto: CreateResignationDto,
    @CurrentUser('id') employeeId: number,
  ) {
    return this.offboardingService.submitResignation(dto, employeeId);
  }

  // ── GET /resignation/my ───────────────────────────────────────────────────

  @Get('my')
  @ApiOperation({ summary: 'Get my resignation requests' })
  findMy(@CurrentUser('id') employeeId: number) {
    return this.offboardingService.findMy(employeeId);
  }

  // ── GET /resignation ──────────────────────────────────────────────────────

  @Get()
  @Roles('admin', 'hr', 'manager')
  @ApiOperation({ summary: 'List all resignation requests (admin, hr, manager)' })
  @ApiQuery({ name: 'status', required: false, enum: ['pending', 'approved', 'rejected', 'completed'] })
  findAll(
    @Query() pagination: PaginationDto,
    @Query('status') status?: string,
  ) {
    return this.offboardingService.findAll({ ...pagination, status });
  }

  // ── GET /resignation/:id ──────────────────────────────────────────────────

  @Get(':id')
  @ApiOperation({ summary: 'Get resignation request detail' })
  @ApiParam({ name: 'id', type: Number })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.offboardingService.findOne(id);
  }

  // ── POST /resignation/:id/approve ────────────────────────────────────────

  @Post(':id/approve')
  @Roles('manager', 'hr', 'admin')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Approve resignation at current step',
    description:
      'Step 1: direct manager only. Step 2: any HR user. ' +
      'Final approval sets status=approved, employee.status=resigned, and creates checklist.',
  })
  @ApiParam({ name: 'id', type: Number })
  approve(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: ApproveResignationDto,
    @CurrentUser('id') actorId: number,
    @CurrentUser('role') actorRole: string,
  ) {
    return this.approvalService.approve(id, dto, actorId, actorRole);
  }

  // ── POST /resignation/:id/reject ──────────────────────────────────────────

  @Post(':id/reject')
  @Roles('manager', 'hr', 'admin')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Reject resignation at current step' })
  @ApiParam({ name: 'id', type: Number })
  reject(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: ApproveResignationDto,
    @CurrentUser('id') actorId: number,
    @CurrentUser('role') actorRole: string,
  ) {
    return this.approvalService.reject(id, dto, actorId, actorRole);
  }

  // ── GET /resignation/checklist/:employeeId ────────────────────────────────

  @Get('checklist/:employeeId')
  @Roles('admin', 'hr')
  @ApiOperation({ summary: 'Get offboarding checklist for an employee (admin, hr)' })
  @ApiParam({ name: 'employeeId', type: Number })
  getChecklist(@Param('employeeId', ParseIntPipe) employeeId: number) {
    return this.offboardingService.getChecklist(employeeId);
  }

  // ── POST /resignation/checklist ───────────────────────────────────────────

  @Post('checklist')
  @Roles('admin', 'hr')
  @ApiOperation({ summary: 'Add a custom checklist item (admin, hr)' })
  createChecklistItem(@Body() dto: CreateChecklistItemDto) {
    return this.offboardingService.createChecklistItem(dto);
  }

  // ── PATCH /resignation/checklist/:id/complete ─────────────────────────────

  @Patch('checklist/:id/complete')
  @Roles('admin', 'hr')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Mark a checklist item as completed (admin, hr)' })
  @ApiParam({ name: 'id', type: Number })
  completeChecklistItem(@Param('id', ParseIntPipe) id: number) {
    return this.offboardingService.completeChecklistItem(id);
  }
}

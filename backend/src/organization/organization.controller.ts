import {
  Controller,
  Get,
  Post,
  Put,
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
import { OrganizationService } from './organization.service';
import { CreateBranchDto } from './dto/create-branch.dto';
import { CreateDepartmentDto } from './dto/create-department.dto';
import { UpdateDepartmentDto } from './dto/update-department.dto';
import { CreatePositionDto } from './dto/create-position.dto';
import { UpdatePositionDto } from './dto/update-position.dto';
import { Roles } from '../common/decorators/roles.decorator';

@ApiTags('Organization')
@ApiBearerAuth('JWT-auth')
@Controller('organization')
export class OrganizationController {
  constructor(private readonly organizationService: OrganizationService) {}

  // ── Branches ─────────────────────────────────────────────────────────────

  @Post('branches')
  @Roles('admin')
  @ApiOperation({ summary: 'Create a new branch (admin only)' })
  createBranch(@Body() dto: CreateBranchDto) {
    return this.organizationService.createBranch(dto);
  }

  @Get('branches')
  @ApiOperation({ summary: 'List all branches' })
  findAllBranches() {
    return this.organizationService.findAllBranches();
  }

  @Get('branches/:id')
  @ApiOperation({ summary: 'Get branch detail' })
  findOneBranch(@Param('id', ParseIntPipe) id: number) {
    return this.organizationService.findOneBranch(id);
  }

  @Patch('branches/:id')
  @Roles('admin')
  @ApiOperation({ summary: 'Partial update branch (admin only)' })
  patchBranch(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: Partial<CreateBranchDto>,
  ) {
    return this.organizationService.updateBranch(id, dto);
  }

  @Put('branches/:id')
  @Roles('admin')
  @ApiOperation({ summary: 'Full replace branch (admin only)' })
  putBranch(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: CreateBranchDto,
  ) {
    return this.organizationService.updateBranch(id, dto);
  }

  // ── Departments ───────────────────────────────────────────────────────────

  @Post('departments')
  @Roles('admin', 'hr')
  @ApiOperation({
    summary: 'Create department',
    description: 'When workingType = SHIFT, the 3 CC shifts (Morning/Afternoon/Night) are auto-created.',
  })
  createDepartment(@Body() dto: CreateDepartmentDto) {
    return this.organizationService.createDepartment(dto);
  }

  @Get('departments')
  @ApiOperation({ summary: 'List departments' })
  @ApiQuery({ name: 'branchId',   required: false, type: Number })
  @ApiQuery({ name: 'activeOnly', required: false, type: Boolean })
  findAllDepartments(
    @Query('branchId')   branchId?: string,
    @Query('activeOnly') activeOnly?: string,
  ) {
    return this.organizationService.findAllDepartments(
      branchId   ? +branchId : undefined,
      activeOnly === 'true',
    );
  }

  @Get('departments/:id')
  @ApiOperation({ summary: 'Get department detail (includes positions and shifts)' })
  findOneDepartment(@Param('id', ParseIntPipe) id: number) {
    return this.organizationService.findOneDepartment(id);
  }

  @Patch('departments/:id')
  @Roles('admin', 'hr')
  @ApiOperation({
    summary: 'Update department',
    description: 'Changing workingType from FIXED → SHIFT auto-creates CC shifts if none exist.',
  })
  updateDepartment(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateDepartmentDto,
  ) {
    return this.organizationService.updateDepartment(id, dto);
  }

  @Delete('departments/:id')
  @Roles('admin')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete department (admin only — blocked if positions exist)' })
  deleteDepartment(@Param('id', ParseIntPipe) id: number) {
    return this.organizationService.deleteDepartment(id);
  }

  // ── Positions ─────────────────────────────────────────────────────────────

  @Post('positions')
  @Roles('admin', 'hr')
  @ApiOperation({ summary: 'Create position' })
  createPosition(@Body() dto: CreatePositionDto) {
    return this.organizationService.createPosition(dto);
  }

  @Get('positions')
  @ApiOperation({ summary: 'List positions' })
  @ApiQuery({ name: 'departmentId', required: false, type: Number })
  @ApiQuery({ name: 'activeOnly',   required: false, type: Boolean })
  findAllPositions(
    @Query('departmentId') departmentId?: string,
    @Query('activeOnly')   activeOnly?: string,
  ) {
    return this.organizationService.findAllPositions(
      departmentId ? +departmentId : undefined,
      activeOnly === 'true',
    );
  }

  @Get('positions/:id')
  @ApiOperation({ summary: 'Get position detail' })
  findOnePosition(@Param('id', ParseIntPipe) id: number) {
    return this.organizationService.findOnePosition(id);
  }

  @Patch('positions/:id')
  @Roles('admin', 'hr')
  @ApiOperation({ summary: 'Update position' })
  updatePosition(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdatePositionDto,
  ) {
    return this.organizationService.updatePosition(id, dto);
  }

  @Delete('positions/:id')
  @Roles('admin', 'hr')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete position (blocked if assigned to employees)' })
  deletePosition(@Param('id', ParseIntPipe) id: number) {
    return this.organizationService.deletePosition(id);
  }

  // ── Shifts (read) ─────────────────────────────────────────────────────────

  @Get('departments/:id/shifts')
  @ApiOperation({ summary: 'Get shifts for a SHIFT-type department (e.g. Command Center)' })
  @ApiParam({ name: 'id', description: 'Department ID' })
  getShiftsByDepartment(@Param('id', ParseIntPipe) id: number) {
    return this.organizationService.getShiftsByDepartment(id);
  }
}

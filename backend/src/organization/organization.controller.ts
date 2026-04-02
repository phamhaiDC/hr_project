import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Query,
  ParseIntPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { OrganizationService } from './organization.service';
import { CreateBranchDto } from './dto/create-branch.dto';
import { CreateDepartmentDto } from './dto/create-department.dto';
import { CreatePositionDto } from './dto/create-position.dto';
import { Roles } from '../common/decorators/roles.decorator';

@ApiTags('Organization')
@ApiBearerAuth('JWT-auth')
@Controller('organization')
export class OrganizationController {
  constructor(private readonly organizationService: OrganizationService) {}

  // ── Branches ──────────────────────────────────────────────

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
  @ApiOperation({ summary: 'Update branch (admin only)' })
  updateBranch(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: Partial<CreateBranchDto>,
  ) {
    return this.organizationService.updateBranch(id, dto);
  }

  // ── Departments ────────────────────────────────────────────

  @Post('departments')
  @Roles('admin', 'hr')
  @ApiOperation({ summary: 'Create a new department' })
  createDepartment(@Body() dto: CreateDepartmentDto) {
    return this.organizationService.createDepartment(dto);
  }

  @Get('departments')
  @ApiOperation({ summary: 'List all departments' })
  @ApiQuery({ name: 'branchId', required: false, type: Number })
  findAllDepartments(@Query('branchId') branchId?: string) {
    return this.organizationService.findAllDepartments(branchId ? +branchId : undefined);
  }

  @Get('departments/:id')
  @ApiOperation({ summary: 'Get department detail' })
  findOneDepartment(@Param('id', ParseIntPipe) id: number) {
    return this.organizationService.findOneDepartment(id);
  }

  @Patch('departments/:id')
  @Roles('admin', 'hr')
  @ApiOperation({ summary: 'Update department' })
  updateDepartment(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: Partial<CreateDepartmentDto>,
  ) {
    return this.organizationService.updateDepartment(id, dto);
  }

  // ── Positions ──────────────────────────────────────────────

  @Post('positions')
  @Roles('admin', 'hr')
  @ApiOperation({ summary: 'Create a new position' })
  createPosition(@Body() dto: CreatePositionDto) {
    return this.organizationService.createPosition(dto);
  }

  @Get('positions')
  @ApiOperation({ summary: 'List all positions' })
  @ApiQuery({ name: 'departmentId', required: false, type: Number })
  findAllPositions(@Query('departmentId') departmentId?: string) {
    return this.organizationService.findAllPositions(departmentId ? +departmentId : undefined);
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
    @Body() dto: Partial<CreatePositionDto>,
  ) {
    return this.organizationService.updatePosition(id, dto);
  }
}

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
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiParam,
} from '@nestjs/swagger';
import { EmployeeService } from './employee.service';
import { CreateEmployeeDto } from './dto/create-employee.dto';
import { UpdateEmployeeDto } from './dto/update-employee.dto';
import { ListEmployeeDto } from './dto/list-employee.dto';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@ApiTags('Employees')
@ApiBearerAuth('JWT-auth')
@Controller('employees')
export class EmployeeController {
  constructor(private readonly employeeService: EmployeeService) {}

  @Post()
  @Roles('admin', 'hr')
  @ApiOperation({ summary: 'Create a new employee (admin, hr only)' })
  create(
    @Body() dto: CreateEmployeeDto,
    @CurrentUser('id') actorId: number,
  ) {
    return this.employeeService.create(dto, actorId);
  }

  @Get()
  @ApiOperation({ summary: 'List all employees with filters & pagination' })
  findAll(@Query() dto: ListEmployeeDto) {
    return this.employeeService.findAll(dto);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get employee detail by ID' })
  @ApiParam({ name: 'id', type: 'integer' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.employeeService.findOne(id);
  }

  @Patch(':id')
  @Roles('admin', 'hr')
  @ApiOperation({ summary: 'Update employee (admin, hr only)' })
  @ApiParam({ name: 'id', type: 'integer' })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateEmployeeDto,
    @CurrentUser('id') actorId: number,
  ) {
    return this.employeeService.update(id, dto, actorId);
  }

  @Delete(':id')
  @Roles('admin')
  @ApiOperation({ summary: 'Deactivate employee (admin only)' })
  @ApiParam({ name: 'id', type: 'integer' })
  remove(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser('id') actorId: number,
  ) {
    return this.employeeService.remove(id, actorId);
  }

  @Get(':id/history')
  @ApiOperation({ summary: 'Get employee change history' })
  @ApiParam({ name: 'id', type: 'integer' })
  getHistory(@Param('id', ParseIntPipe) id: number) {
    return this.employeeService.getHistory(id);
  }
}

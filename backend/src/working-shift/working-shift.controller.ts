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
} from '@nestjs/swagger';
import { WorkingShiftService } from './working-shift.service';
import { CreateWorkingShiftDto } from './dto/create-working-shift.dto';
import { UpdateWorkingShiftDto } from './dto/update-working-shift.dto';
import { Roles } from '../common/decorators/roles.decorator';

@ApiTags('Working Shifts')
@ApiBearerAuth('JWT-auth')
@Controller('working-shifts')
export class WorkingShiftController {
  constructor(private readonly service: WorkingShiftService) {}

  // GET /working-shifts?departmentId=&includeGlobal=&activeOnly=
  @Get()
  @ApiOperation({ summary: 'List working shifts (optionally filtered by department)' })
  @ApiQuery({ name: 'departmentId',   required: false, type: Number })
  @ApiQuery({ name: 'includeGlobal',  required: false, type: Boolean })
  @ApiQuery({ name: 'activeOnly',     required: false, type: Boolean })
  findAll(
    @Query('departmentId')  departmentIdRaw?:   string,
    @Query('includeGlobal') includeGlobalRaw?:  string,
    @Query('activeOnly')    activeOnlyRaw?:     string,
  ) {
    const departmentId  = departmentIdRaw ? Number(departmentIdRaw) : undefined;
    const includeGlobal = includeGlobalRaw !== 'false';
    const activeOnly    = activeOnlyRaw    === 'true';
    return this.service.findAll({ departmentId, includeGlobal, activeOnly });
  }

  // GET /working-shifts/:id
  @Get(':id')
  @ApiOperation({ summary: 'Get a working shift by ID' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.service.findOne(id);
  }

  // POST /working-shifts
  @Post()
  @Roles('admin', 'hr')
  @ApiOperation({ summary: 'Create a working shift (admin, hr)' })
  create(@Body() dto: CreateWorkingShiftDto) {
    return this.service.create(dto);
  }

  // PATCH /working-shifts/:id
  @Patch(':id')
  @Roles('admin', 'hr')
  @ApiOperation({ summary: 'Update a working shift (admin, hr)' })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateWorkingShiftDto,
  ) {
    return this.service.update(id, dto);
  }

  // DELETE /working-shifts/:id
  @Delete(':id')
  @Roles('admin')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a working shift (admin only)' })
  delete(@Param('id', ParseIntPipe) id: number) {
    return this.service.delete(id);
  }
}

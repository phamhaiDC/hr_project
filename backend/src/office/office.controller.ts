import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  ParseIntPipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiNotFoundResponse,
} from '@nestjs/swagger';
import { OfficeService } from './office.service';
import { CreateOfficeDto } from './dto/create-office.dto';
import { Roles } from '../common/decorators/roles.decorator';

@ApiTags('Office')
@ApiBearerAuth('JWT-auth')
@Controller('office')
export class OfficeController {
  constructor(private readonly officeService: OfficeService) {}

  @Post()
  @Roles('admin', 'hr')
  @ApiOperation({ summary: 'Create an office location (admin, hr)' })
  @ApiCreatedResponse({ description: 'Office created successfully' })
  create(@Body() dto: CreateOfficeDto) {
    return this.officeService.create(dto);
  }

  @Get()
  @ApiOperation({ summary: 'List all office locations' })
  @ApiOkResponse({ description: 'Array of offices with employee count' })
  findAll() {
    return this.officeService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get office location detail with assigned employees' })
  @ApiOkResponse({ description: 'Office detail' })
  @ApiNotFoundResponse({ description: 'Office not found' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.officeService.findOne(id);
  }
}

import { Controller, Get, Post, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { SystemConfigService } from './system-config.service';

@ApiTags('System Config')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('system-config')
export class SystemConfigController {
  constructor(private readonly systemConfigService: SystemConfigService) {}

  @Get()
  @Roles('admin', 'hr')
  @ApiOperation({ summary: 'Get all system settings' })
  getAll() {
    return this.systemConfigService.getAll();
  }

  @Post()
  @Roles('admin', 'hr')
  @ApiOperation({ summary: 'Update system setting' })
  update(@Body() dto: { key: string; value: string }) {
    return this.systemConfigService.set(dto.key, dto.value);
  }
}

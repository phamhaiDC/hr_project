import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString, IsDateString } from 'class-validator';

export enum AttendanceType {
  check_in = 'check_in',
  check_out = 'check_out',
}

export class CheckInOutDto {
  @ApiProperty({ enum: AttendanceType })
  @IsEnum(AttendanceType)
  type: AttendanceType;

  @ApiPropertyOptional({ description: 'Source device ID or "manual"' })
  @IsOptional()
  @IsString()
  source?: string;

  @ApiPropertyOptional({ description: 'Override timestamp (ISO 8601). Defaults to now.' })
  @IsOptional()
  @IsDateString()
  timestamp?: string;
}

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  Matches,
  IsOptional,
  IsInt,
  IsBoolean,
  Min,
  Max,
} from 'class-validator';
import { Type } from 'class-transformer';

const TIME_PATTERN = /^\d{2}:\d{2}$/;

export class CreateShiftDto {
  @ApiProperty({ example: 'Morning Shift' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ example: '08:00', description: 'Shift start in HH:MM (24h)' })
  @IsString()
  @Matches(TIME_PATTERN, { message: 'startTime must be HH:MM' })
  startTime: string;

  @ApiProperty({ example: '17:00', description: 'Shift end in HH:MM (24h)' })
  @IsString()
  @Matches(TIME_PATTERN, { message: 'endTime must be HH:MM' })
  endTime: string;

  @ApiPropertyOptional({ example: 60, default: 60, description: 'Break duration in minutes' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(240)
  breakMinutes?: number;

  @ApiPropertyOptional({ example: 15, default: 15, description: 'Grace period before marking late (minutes)' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(120)
  graceLateMinutes?: number;

  @ApiPropertyOptional({ example: 15, default: 15, description: 'Grace period before marking early-out (minutes)' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(120)
  graceEarlyMinutes?: number;

  @ApiPropertyOptional({ default: false, description: 'Mark this as the default shift for auto-detection' })
  @IsOptional()
  @IsBoolean()
  isDefault?: boolean;
}

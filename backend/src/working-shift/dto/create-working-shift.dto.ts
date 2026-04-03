import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  Matches,
  IsOptional,
  IsInt,
  IsBoolean,
  IsPositive,
  Min,
  Max,
} from 'class-validator';
import { Type } from 'class-transformer';

const TIME_RE = /^\d{2}:\d{2}$/;
const CODE_RE = /^[A-Z0-9_-]+$/;

export class CreateWorkingShiftDto {
  @ApiProperty({ example: 'Morning Shift' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ example: 'CC_MORNING', description: 'Unique uppercase code' })
  @IsString()
  @Matches(CODE_RE, { message: 'code must be uppercase letters, digits, underscores or hyphens' })
  code: string;

  @ApiProperty({ example: '07:00', description: 'Shift start HH:MM (24h)' })
  @IsString()
  @Matches(TIME_RE, { message: 'startTime must be HH:MM' })
  startTime: string;

  @ApiProperty({ example: '15:00', description: 'Shift end HH:MM (24h)' })
  @IsString()
  @Matches(TIME_RE, { message: 'endTime must be HH:MM' })
  endTime: string;

  @ApiPropertyOptional({ example: false, description: 'true when shift spans midnight (endTime < startTime)' })
  @IsOptional()
  @IsBoolean()
  isCrossDay?: boolean;

  @ApiPropertyOptional({ example: 60, default: 60 })
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

  @ApiPropertyOptional({ example: null, description: 'null = global shift; ID = department-specific' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @IsPositive()
  departmentId?: number;

  @ApiPropertyOptional({ default: false, description: 'Mark as the default shift for auto-detection (only 1 allowed)' })
  @IsOptional()
  @IsBoolean()
  isDefault?: boolean;

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

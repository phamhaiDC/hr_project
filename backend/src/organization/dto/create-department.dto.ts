import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsInt,
  IsOptional,
  IsBoolean,
  IsIn,
  MaxLength,
  Matches,
} from 'class-validator';
import { Type } from 'class-transformer';

export const WORKING_TYPES = ['FIXED', 'SHIFT'] as const;
export type WorkingType = (typeof WORKING_TYPES)[number];

export class CreateDepartmentDto {
  @ApiProperty({ example: 'Command Center' })
  @IsString()
  name: string;

  /** Unique short code, e.g. "CC", "IT", "HR" */
  @ApiProperty({ example: 'CC', description: 'Unique department code (uppercase letters/digits/hyphen)' })
  @IsString()
  @MaxLength(20)
  @Matches(/^[A-Z0-9_-]+$/, { message: 'code must be uppercase letters, digits, underscores or hyphens' })
  code: string;

  @ApiPropertyOptional({ enum: WORKING_TYPES, default: 'FIXED' })
  @IsOptional()
  @IsIn(WORKING_TYPES)
  workingType?: WorkingType;

  @ApiPropertyOptional({ example: 'Monitors network operations 24/7' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional({ description: 'Branch ID' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  branchId?: number;
}

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsInt,
  IsOptional,
  IsBoolean,
  MaxLength,
  Matches,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreatePositionDto {
  @ApiProperty({ example: 'Network Operations Engineer' })
  @IsString()
  name: string;

  @ApiProperty({ example: 'NOE', description: 'Unique position code (uppercase letters/digits/hyphen)' })
  @IsString()
  @MaxLength(20)
  @Matches(/^[A-Z0-9_-]+$/, { message: 'code must be uppercase letters, digits, underscores or hyphens' })
  code: string;

  @ApiProperty({ description: 'Department ID' })
  @Type(() => Number)
  @IsInt()
  departmentId: number;

  @ApiPropertyOptional({ example: 'Monitors network health and responds to incidents' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

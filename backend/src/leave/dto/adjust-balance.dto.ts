import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNumber, IsString, IsOptional, IsPositive, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class AdjustBalanceDto {
  @ApiProperty({ example: 12, description: 'New total leave days to set' })
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  total: number;

  @ApiPropertyOptional({ example: 'Annual allocation for 2025' })
  @IsOptional()
  @IsString()
  reason?: string;
}

export class AccrueLeaveDto {
  @ApiPropertyOptional({ example: 1.0, description: 'Days to accrue per employee (default 1.0)' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @IsPositive()
  daysPerEmployee?: number;

  @ApiPropertyOptional({ example: 1, description: 'Accrue only for this employee ID (leave empty for all)' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  employeeId?: number;

  @ApiPropertyOptional({ example: 'Manual accrual - Q1 2025' })
  @IsOptional()
  @IsString()
  note?: string;
}

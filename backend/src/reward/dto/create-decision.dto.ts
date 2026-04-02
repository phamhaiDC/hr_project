import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsInt, IsDateString, IsOptional, IsNumber } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateDecisionDto {
  @ApiProperty({ description: 'Employee ID (integer)' })
  @Type(() => Number)
  @IsInt()
  employeeId: number;

  @ApiProperty({ example: 'promotion', enum: ['promotion', 'transfer', 'disciplinary', 'reward', 'penalty'] })
  @IsString()
  type: string;

  @ApiProperty({ example: 'Excellent performance' })
  @IsString()
  reason: string;

  @ApiPropertyOptional({ example: 5000000 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  amount?: number;

  @ApiProperty({ example: '2024-03-31' })
  @IsDateString()
  date: string;
}

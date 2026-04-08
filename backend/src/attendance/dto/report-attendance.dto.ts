import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsInt, IsDateString, IsString } from 'class-validator';
import { Type } from 'class-transformer';
import { PaginationDto } from '../../common/dto/pagination.dto';

export class ReportAttendanceDto extends PaginationDto {
  @ApiPropertyOptional({ type: Number, description: 'Filter by employee ID' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  employeeId?: number;

  @ApiPropertyOptional({ type: Number, description: 'Filter by department ID' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  departmentId?: number;

  @ApiPropertyOptional({ example: '2024-03-01', description: 'From date (YYYY-MM-DD), inclusive' })
  @IsOptional()
  @IsDateString()
  dateFrom?: string;

  @ApiPropertyOptional({ example: '2024-03-31', description: 'To date (YYYY-MM-DD), inclusive' })
  @IsOptional()
  @IsDateString()
  dateTo?: string;

  @ApiPropertyOptional({ description: 'Search name or code' })
  @IsOptional()
  @IsString()
  q?: string;

  @ApiPropertyOptional({ description: 'Search employee name' })
  @IsOptional()
  @IsString()
  employeeName?: string;

  @ApiPropertyOptional({ description: 'Search employee code' })
  @IsOptional()
  @IsString()
  employeeCode?: string;

  @ApiPropertyOptional({ description: 'Filter by late status' })
  @IsOptional()
  @Type(() => Boolean)
  isLate?: boolean;

  @ApiPropertyOptional({ description: 'Filter by early out status' })
  @IsOptional()
  @Type(() => Boolean)
  isEarlyOut?: boolean;

  @ApiPropertyOptional({ description: 'Filter by overtime status' })
  @IsOptional()
  @Type(() => Boolean)
  isOvertime?: boolean;
}

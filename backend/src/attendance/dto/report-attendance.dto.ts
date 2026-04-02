import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsInt, IsDateString } from 'class-validator';
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
}

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsISO8601,
  IsBoolean,
  IsOptional,
} from 'class-validator';

export class CreateHolidayDto {
  @ApiProperty({ example: 'Independence Day' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ example: '2025-09-02', description: 'Start date (ISO 8601 date)' })
  @IsISO8601()
  fromDate: string;

  @ApiProperty({ example: '2025-09-02', description: 'End date (ISO 8601 date, inclusive)' })
  @IsISO8601()
  toDate: string;

  @ApiPropertyOptional({ default: true, description: 'Is this a paid holiday?' })
  @IsOptional()
  @IsBoolean()
  isPaid?: boolean;

  @ApiPropertyOptional({
    default: false,
    description: 'Recur every year on the same calendar month/day',
  })
  @IsOptional()
  @IsBoolean()
  isRecurring?: boolean;

  @ApiPropertyOptional({ example: 'National independence celebration' })
  @IsOptional()
  @IsString()
  description?: string;
}

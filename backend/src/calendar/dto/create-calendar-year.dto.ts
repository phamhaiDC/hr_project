import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsInt,
  IsArray,
  ArrayUnique,
  Min,
  Max,
  IsOptional,
  IsString,
  IsBoolean,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreateCalendarYearDto {
  @ApiProperty({ example: 2025, description: 'Calendar year' })
  @Type(() => Number)
  @IsInt()
  @Min(2000)
  @Max(2100)
  year: number;

  @ApiProperty({
    example: [0, 6],
    description: 'Days-of-week treated as weekend (0=Sun … 6=Sat). Default [0, 6].',
  })
  @IsArray()
  @ArrayUnique()
  @IsInt({ each: true })
  @Min(0, { each: true })
  @Max(6, { each: true })
  weekendDays: number[];

  @ApiPropertyOptional({ example: 'VN' })
  @IsOptional()
  @IsString()
  country?: string;

  @ApiPropertyOptional({ example: 'Vietnamese national calendar 2025' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({
    default: false,
    description: 'Immediately generate CalendarDay rows after creating the year config',
  })
  @IsOptional()
  @IsBoolean()
  autoGenerate?: boolean;
}

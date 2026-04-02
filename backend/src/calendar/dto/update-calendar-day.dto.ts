import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsBoolean, IsOptional, IsString } from 'class-validator';

export class UpdateCalendarDayDto {
  @ApiProperty({ enum: ['WORKING', 'WEEKEND', 'HOLIDAY', 'COMPENSATION'] })
  @IsIn(['WORKING', 'WEEKEND', 'HOLIDAY', 'COMPENSATION'])
  type: 'WORKING' | 'WEEKEND' | 'HOLIDAY' | 'COMPENSATION';

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  isPaid?: boolean;

  @ApiPropertyOptional({ example: 'Lunar New Year makeup' })
  @IsOptional()
  @IsString()
  note?: string;
}

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsInt } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateChecklistItemDto {
  @ApiProperty({ description: 'Employee ID (integer)' })
  @Type(() => Number)
  @IsInt()
  employeeId: number;

  @ApiProperty({ example: 'Return laptop and access card' })
  @IsString()
  item: string;

  @ApiPropertyOptional({ default: 'pending' })
  @IsOptional()
  @IsString()
  status?: string;
}

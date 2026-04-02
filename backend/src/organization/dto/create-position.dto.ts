import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsInt, IsOptional } from 'class-validator';
import { Type } from 'class-transformer';

export class CreatePositionDto {
  @ApiProperty({ example: 'Software Engineer' })
  @IsString()
  name: string;

  @ApiPropertyOptional({ description: 'Department ID (integer)' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  departmentId?: number;
}

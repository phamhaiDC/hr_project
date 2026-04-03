import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsNumber, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateBranchDto {
  @ApiProperty({ example: 'Ho Chi Minh City Branch' })
  @IsString()
  name: string;

  @ApiPropertyOptional({ example: 10.7719, description: 'Latitude (-90 to 90)' })
  @IsOptional()
  @IsNumber()
  @Min(-90)
  @Max(90)
  @Type(() => Number)
  latitude?: number;

  @ApiPropertyOptional({ example: 106.7042, description: 'Longitude (-180 to 180)' })
  @IsOptional()
  @IsNumber()
  @Min(-180)
  @Max(180)
  @Type(() => Number)
  longitude?: number;

  @ApiPropertyOptional({ example: 50, description: 'Geofence radius in metres (> 0)', default: 50 })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Type(() => Number)
  radius?: number;
}

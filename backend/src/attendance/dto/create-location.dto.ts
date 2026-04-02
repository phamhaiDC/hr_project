import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsNumber, IsOptional, Min, Max, IsInt } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateLocationDto {
  @ApiProperty({ example: 'Head Office' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ example: 10.7769, description: 'Latitude' })
  @Type(() => Number)
  @IsNumber()
  @Min(-90)
  @Max(90)
  lat: number;

  @ApiProperty({ example: 106.7009, description: 'Longitude' })
  @Type(() => Number)
  @IsNumber()
  @Min(-180)
  @Max(180)
  lng: number;

  @ApiProperty({ example: 200, description: 'Geofence radius in metres' })
  @Type(() => Number)
  @IsInt()
  @Min(10)
  @Max(5000)
  radius: number;

  @ApiPropertyOptional({ example: '123 Main Street, District 1' })
  @IsOptional()
  @IsString()
  address?: string;
}

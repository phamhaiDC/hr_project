import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNumber, IsInt, Min, Max, IsNotEmpty } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateOfficeDto {
  @ApiProperty({ example: 'Head Office – HCM' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({
    example: 10.7769,
    description: 'Latitude in decimal degrees (-90 to 90)',
  })
  @Type(() => Number)
  @IsNumber()
  @Min(-90, { message: 'latitude must be >= -90' })
  @Max(90,  { message: 'latitude must be <= 90' })
  latitude: number;

  @ApiProperty({
    example: 106.7009,
    description: 'Longitude in decimal degrees (-180 to 180)',
  })
  @Type(() => Number)
  @IsNumber()
  @Min(-180, { message: 'longitude must be >= -180' })
  @Max(180,  { message: 'longitude must be <= 180' })
  longitude: number;

  @ApiProperty({
    example: 100,
    description: 'Geofence radius in metres (must be ≥ 1)',
  })
  @Type(() => Number)
  @IsInt()
  @Min(1, { message: 'radius must be a positive integer' })
  radius: number;
}

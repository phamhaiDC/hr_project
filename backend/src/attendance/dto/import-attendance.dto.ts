import { ApiProperty } from '@nestjs/swagger';
import {
  IsArray,
  IsDateString,
  IsString,
  ValidateNested,
  ArrayMinSize,
} from 'class-validator';
import { Type } from 'class-transformer';

export class RawTimestampDto {
  @ApiProperty({ example: 'EMP001', description: 'Employee code from the access device' })
  @IsString()
  employeeCode: string;

  @ApiProperty({ example: '2024-03-10T08:05:23.000Z', description: 'ISO 8601 timestamp' })
  @IsDateString()
  timestamp: string;
}

export class ImportAttendanceDto {
  @ApiProperty({ type: [RawTimestampDto], description: 'List of raw timestamps to import' })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => RawTimestampDto)
  records: RawTimestampDto[];
}

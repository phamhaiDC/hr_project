import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsInt } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateDepartmentDto {
  @ApiProperty({ example: 'Information Technology' })
  @IsString()
  name: string;

  @ApiProperty({ description: 'Branch ID (integer)' })
  @Type(() => Number)
  @IsInt()
  branchId: number;
}

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEmail,
  IsString,
  IsOptional,
  IsInt,
  MinLength,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreateEmployeeDto {
  @ApiProperty({ example: 'E001' })
  @IsString()
  code: string;

  @ApiProperty({ example: 'Nguyen Van A' })
  @IsString()
  fullName: string;

  @ApiProperty({ example: 'nguyen.vana@company.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'Password@123', minLength: 8 })
  @IsString()
  @MinLength(8)
  password: string;

  @ApiPropertyOptional({ example: '0912345678' })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiProperty({ description: 'Branch ID (integer)' })
  @Type(() => Number)
  @IsInt()
  branchId: number;

  @ApiProperty({ description: 'Department ID (integer)' })
  @Type(() => Number)
  @IsInt()
  departmentId: number;

  @ApiProperty({ description: 'Position ID (integer)' })
  @Type(() => Number)
  @IsInt()
  positionId: number;

  @ApiPropertyOptional({ description: 'Manager Employee ID (integer)' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  managerId?: number;

  @ApiPropertyOptional({ example: 'probation', default: 'probation' })
  @IsOptional()
  @IsString()
  status?: string;

  @ApiPropertyOptional({ example: 'employee', default: 'employee' })
  @IsOptional()
  @IsString()
  role?: string;
}

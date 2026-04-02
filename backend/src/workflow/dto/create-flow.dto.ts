import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsArray,
  ValidateNested,
  IsInt,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreateApprovalStepDto {
  @ApiProperty({ example: 1 })
  @IsInt()
  @Min(1)
  stepOrder: number;

  @ApiProperty({ example: 'manager', enum: ['manager', 'hr', 'admin'] })
  @IsString()
  approverType: string;
}

export class CreateApprovalFlowDto {
  @ApiProperty({ example: 'leave', enum: ['leave', 'resignation', 'contract'] })
  @IsString()
  type: string;

  @ApiProperty({ type: [CreateApprovalStepDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateApprovalStepDto)
  steps: CreateApprovalStepDto[];
}

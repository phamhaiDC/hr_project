import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class CreateBranchDto {
  @ApiProperty({ example: 'Ho Chi Minh City Branch' })
  @IsString()
  name: string;
}

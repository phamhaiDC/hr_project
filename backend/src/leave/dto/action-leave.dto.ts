import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class ActionLeaveDto {
  @ApiPropertyOptional({ example: 'Looks good, approved.' })
  @IsOptional()
  @IsString()
  comments?: string;
}

import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class ApproveResignationDto {
  @ApiPropertyOptional({ example: 'Approved. Handover plan confirmed.' })
  @IsOptional()
  @IsString()
  comments?: string;
}

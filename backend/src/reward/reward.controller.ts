import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  ParseIntPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { RewardService } from './reward.service';
import { CreateDecisionDto } from './dto/create-decision.dto';
import { RewardListDto } from './dto/reward-list.dto';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@ApiTags('Rewards')
@ApiBearerAuth('JWT-auth')
@Controller('rewards')
export class RewardController {
  constructor(private readonly rewardService: RewardService) {}

  @Post('decisions')
  @Roles('admin', 'hr')
  @ApiOperation({ summary: 'Create a decision (reward, promotion, etc.)' })
  createDecision(
    @Body() dto: CreateDecisionDto,
    @CurrentUser('id') actorId: number,
  ) {
    return this.rewardService.createDecision(dto, actorId);
  }

  @Get('decisions')
  @ApiOperation({ summary: 'List all decisions' })
  findAll(@Query() query: RewardListDto) {
    return this.rewardService.findAll(query);
  }

  @Get('decisions/:id')
  @ApiOperation({ summary: 'Get decision detail' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.rewardService.findOne(id);
  }

  @Get('employee/:employeeId')
  @ApiOperation({ summary: 'Get all decisions for an employee' })
  findByEmployee(@Param('employeeId', ParseIntPipe) employeeId: number) {
    return this.rewardService.findByEmployee(employeeId);
  }
}

import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  Query,
  ParseIntPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { WorkflowService } from './workflow.service';
import { CreateApprovalFlowDto } from './dto/create-flow.dto';
import { Roles } from '../common/decorators/roles.decorator';

@ApiTags('Workflow')
@ApiBearerAuth('JWT-auth')
@Controller('workflow')
export class WorkflowController {
  constructor(private readonly workflowService: WorkflowService) {}

  @Post('flows')
  @Roles('admin')
  @ApiOperation({ summary: 'Create an approval flow (admin only)' })
  createFlow(@Body() dto: CreateApprovalFlowDto) {
    return this.workflowService.createFlow(dto);
  }

  @Get('flows')
  @ApiOperation({ summary: 'List approval flows' })
  @ApiQuery({ name: 'type', required: false })
  findAll(@Query('type') type?: string) {
    return this.workflowService.findAll(type);
  }

  @Get('flows/:id')
  @ApiOperation({ summary: 'Get approval flow detail' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.workflowService.findOne(id);
  }

  @Delete('flows/:id')
  @Roles('admin')
  @ApiOperation({ summary: 'Delete approval flow (admin only)' })
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.workflowService.remove(id);
  }
}

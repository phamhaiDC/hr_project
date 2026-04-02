import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Query,
  ParseIntPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { ContractService } from './contract.service';
import { CreateContractDto } from './dto/create-contract.dto';
import { ContractListDto } from './dto/contract-list.dto';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@ApiTags('Contracts')
@ApiBearerAuth('JWT-auth')
@Controller('contracts')
export class ContractController {
  constructor(private readonly contractService: ContractService) {}

  @Post()
  @Roles('admin', 'hr')
  @ApiOperation({ summary: 'Create a new contract' })
  create(
    @Body() dto: CreateContractDto,
    @CurrentUser('id') actorId: number,
  ) {
    return this.contractService.create(dto, actorId);
  }

  @Get()
  @ApiOperation({ summary: 'List all contracts' })
  findAll(@Query() query: ContractListDto) {
    return this.contractService.findAll(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get contract detail' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.contractService.findOne(id);
  }

  @Patch(':id/terminate')
  @Roles('admin', 'hr')
  @ApiOperation({ summary: 'Terminate a contract' })
  terminate(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser('id') actorId: number,
  ) {
    return this.contractService.terminate(id, actorId);
  }
}

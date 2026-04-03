import { Body, Controller, Get, HttpCode, HttpStatus, Patch } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { EmployeeService } from '../employee/employee.service';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { UpdateMeDto } from './dto/update-me.dto';
import { ChangeMyPasswordDto } from './dto/change-my-password.dto';

@ApiTags('Me')
@ApiBearerAuth('JWT-auth')
@Controller('me')
export class MeController {
  constructor(private readonly employeeService: EmployeeService) {}

  @Get()
  @ApiOperation({ summary: 'Get own profile' })
  getMe(@CurrentUser('id') userId: number) {
    return this.employeeService.getMe(userId);
  }

  @Patch()
  @ApiOperation({ summary: 'Update own profile (name / email / phone)' })
  updateMe(
    @CurrentUser('id') userId: number,
    @Body() dto: UpdateMeDto,
  ) {
    return this.employeeService.updateMe(userId, dto);
  }

  @Patch('password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Change own password (requires current password)' })
  changePassword(
    @CurrentUser('id') userId: number,
    @Body() dto: ChangeMyPasswordDto,
  ) {
    return this.employeeService.updateMyPassword(userId, dto);
  }
}

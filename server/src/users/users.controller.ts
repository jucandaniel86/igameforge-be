import {
  Controller,
  Get,
  Post,
  Query,
  UseGuards,
  Body,
  Delete,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { UsersService } from './users.service.js';
import { UsersFilterDto } from './dto/UsersFilterDto.js';
import { SaveUsersDto } from './dto/SaveUsersDto.js';
import { withMessage } from '../common/interceptors/response.interceptor.js';
import { ChangePasswordDto } from './dto/ChangePasswordDto.js';
import { CurrentUser } from '../auth/decorators/current-user.decorator.js';
import { JwtPayload } from '../auth/strategies/jwt.strategy.js';
import { ChangeEnvironmentDto } from './dto/ChangeEnvironmentDto.js';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('list')
  @UseGuards(JwtAuthGuard)
  getUsersList(@Query() dto: UsersFilterDto) {
    return this.usersService.getUsersList(
      dto.search ?? '',
      dto.start,
      dto.length,
    );
  }

  @Post('save')
  @UseGuards(JwtAuthGuard)
  async saveUser(@Body() dto: SaveUsersDto) {
    const user = await this.usersService.saveUser(dto);

    return withMessage(user, 'The user was saved successfully');
  }

  @Delete('delete')
  @UseGuards(JwtAuthGuard)
  async deleteRole(@Query() query: any) {
    const result = await this.usersService.deleteUser(query.id);

    return withMessage(result, 'The user was deleted successfully');
  }

  @Post('change-password')
  @UseGuards(JwtAuthGuard)
  async changePassword(@Body() dto: ChangePasswordDto) {
    const result = await this.usersService.changePassword(dto);

    return withMessage(result, 'Password changed successfully');
  }

  @Get('change-env')
  @UseGuards(JwtAuthGuard)
  async changeUserEnvironment(
    @CurrentUser() user: JwtPayload,
    @Query() request: ChangeEnvironmentDto,
  ) {
    const result = await this.usersService.changeUserEnvironment(
      user,
      request.env,
    );
    return withMessage(result, 'The environemnt was changed successfully');
  }
}

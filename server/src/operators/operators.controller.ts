import { Controller, Get, UseGuards } from '@nestjs/common';
import { OperatorsService } from './operators.service.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { JwtPayload } from '../auth/strategies/jwt.strategy.js';
import { CurrentUser } from '../auth/decorators/current-user.decorator.js';

@Controller('operators')
export class OperatorsController {
  constructor(private readonly operatorsService: OperatorsService) {}

  @UseGuards(JwtAuthGuard)
  @Get()
  findAll(@CurrentUser() user: JwtPayload) {
    return this.operatorsService.findAll(user.env);
  }

  @UseGuards(JwtAuthGuard)
  @Get('/selector')
  selector(@CurrentUser() user: JwtPayload) {
    return this.operatorsService.selector(user.env);
  }
}

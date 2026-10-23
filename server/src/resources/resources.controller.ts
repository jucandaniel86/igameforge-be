import { Controller, Get, UseGuards, Query } from '@nestjs/common';
import { JwtPayload } from '../auth/strategies/jwt.strategy.js';
import { CurrentUser } from '../auth/decorators/current-user.decorator.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { ResourcesService } from './resources.service.js';
import { GetGameResourcesDto } from './dto/resources.dto.js';

@Controller('resources')
export class ResourcesController {
  constructor(private readonly resourcesService: ResourcesService) {}

  @Get('games')
  @UseGuards(JwtAuthGuard)
  getGames(@CurrentUser() user: JwtPayload) {
    return this.resourcesService.getGames(user.env);
  }

  @Get('languages')
  @UseGuards(JwtAuthGuard)
  getLanguages() {
    return this.resourcesService.getLanguages();
  }

  @Get('operator-fields/get')
  @UseGuards(JwtAuthGuard)
  async getOperatorFields(@Query('operatorID') operatorID: string) {
    return {
      fields: await this.resourcesService.getOperatorFields(operatorID),
    };
  }

  @Get('get')
  @UseGuards(JwtAuthGuard)
  async getGameResource(
    @Query() query: GetGameResourcesDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return {
      fields: await this.resourcesService.getGameResources(
        query,
        query.env ?? user.env ?? 'dev',
      ),
    };
  }

  @Get('game-resource-types/list')
  @UseGuards(JwtAuthGuard)
  async getGameResourceTypeOptions() {
    return {
      fields: await this.resourcesService.getGameResourceTypeOptions(),
    };
  }
}

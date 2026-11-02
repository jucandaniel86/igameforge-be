import { Controller, Get, Query } from '@nestjs/common';
import { GameApiRespourcesDto } from './dto/GameApiResources.dto.js';
import { GamesService } from './games.service.js';
import { SkipTransform } from '../common/decorators/skip-transform.decorator.js';

@Controller('games')
export class GamesController {
  constructor(private readonly gamesService: GamesService) {}

  @Get('getlist')
  @SkipTransform()
  async getAPIGameResources(@Query() dto: GameApiRespourcesDto) {
    return this.gamesService.getAPIGameResources(dto);
  }
}

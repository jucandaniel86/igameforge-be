import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { SyncForgeDto } from './dto/sync-forge.dto.js';
import { ForgeService } from './forge.service.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';

@Controller('forge')
@UseGuards(JwtAuthGuard)
export class ForgeController {
  constructor(private readonly forgeService: ForgeService) {}

  @Post('sync/games')
  @UseGuards(JwtAuthGuard)
  async syncGames(@Body() dto: SyncForgeDto) {
    return this.forgeService.syncGames(dto.env);
  }

  @Post('sync/operators')
  @UseGuards(JwtAuthGuard)
  async syncOperators(@Body() dto: SyncForgeDto) {
    return this.forgeService.syncOperators(dto.env);
  }

  @Get('last-updates')
  @UseGuards(JwtAuthGuard)
  async getLastUpdates() {
    return this.forgeService.getLastUpdates();
  }
}

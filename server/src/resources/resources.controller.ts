import {
  Controller,
  Get,
  Post,
  UseGuards,
  Query,
  Body,
  Delete,
} from '@nestjs/common';
import { JwtPayload } from '../auth/strategies/jwt.strategy.js';
import { CurrentUser } from '../auth/decorators/current-user.decorator.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { ResourcesService } from './resources.service.js';
import { GetGameResourcesDto } from './dto/resources.dto.js';
import { SaveOperatorFieldDto } from './dto/SaveOperatorField.dto.js';
import { withMessage } from '../common/interceptors/response.interceptor.js';
import { DeleteOperatorField } from './dto/DeleteOperatorField.dto.js';
import { GameResourceTypes } from './dto/GameResourceTypes.dto.js';
import { SaveGameSettingsDto } from './dto/SaveGameSettings.dto.js';
import { OperatorActiveGamesDto } from './dto/OperatorActiveGames.dto.js';
import { SaveResourcesDto } from './dto/SaveResources.dto.js';
import { ImportGamesToOperatorDto } from './dto/ImportGamesToOperator.dto.js';
import { CopyOperatorResourcesToEnvironmentDto } from './dto/CopyOperatorResourcesToEnvironment.dto.js';

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

  @Post('operator-fields/save')
  @UseGuards(JwtAuthGuard)
  async saveOperatorField(@Body() dto: SaveOperatorFieldDto) {
    const response = await this.resourcesService.saveOperatorField(dto);
    return withMessage(response, 'The field was saved successfully!');
  }

  @Delete('operator-fields/delete')
  @UseGuards(JwtAuthGuard)
  async deleteOperatorFields(@Query() dto: DeleteOperatorField) {
    const response = await this.resourcesService.deleteOperatorFields(
      BigInt(dto.fieldID),
    );
    return withMessage(response, 'The field was deleted successfully!');
  }

  @Get('game-resource-types/get')
  @UseGuards(JwtAuthGuard)
  async getGameResourceTypes(@Query() dto: GameResourceTypes) {
    return {
      fields: await this.resourcesService.getGameResourceTypes(dto),
    };
  }

  @Get('game-templates')
  @UseGuards(JwtAuthGuard)
  async getGamesTemplates(@CurrentUser() user: JwtPayload) {
    return await this.resourcesService.getGamesTemplates(user.env);
  }

  @Post('game-settings/save')
  @UseGuards(JwtAuthGuard)
  async saveGameSettings(@Body() dto: SaveGameSettingsDto) {
    const response = await this.resourcesService.saveGameSettings(dto);
    return withMessage(
      {
        fields: response,
      },
      'The game settings were saved successfuly!',
    );
  }

  @Get('operator-disabled-games')
  @UseGuards(JwtAuthGuard)
  async operatorActiveGames(@Query() dto: OperatorActiveGamesDto) {
    return await this.resourcesService.operatorActiveGames(dto);
  }

  @Post('operator-active-games/save')
  @UseGuards(JwtAuthGuard)
  async saveOperatorActiveGames(@Body() dto: OperatorActiveGamesDto) {
    return await this.resourcesService.saveOperatorActiveGames(dto);
  }

  @Post('save-resources')
  @UseGuards(JwtAuthGuard)
  async saveBulkGameResources(
    @Body() dto: SaveResourcesDto,
    @CurrentUser() user: JwtPayload,
  ) {
    const result = await this.resourcesService.saveBulkGameResources(
      dto,
      user.env,
    );

    return withMessage(result, 'The field was saved successfully!');
  }

  @Post('import-games-to-operator')
  @UseGuards(JwtAuthGuard)
  async importGamesToOperator(@Body() dto: ImportGamesToOperatorDto) {
    const result = await this.resourcesService.importGamesToOperator(dto);

    return withMessage(result, result?.message);
  }

  @Post('copy-environment')
  @UseGuards(JwtAuthGuard)
  async copyOperatorResourcesToEnvironment(
    @Body() dto: CopyOperatorResourcesToEnvironmentDto,
  ) {
    const result =
      await this.resourcesService.copyOperatorResourcesToEnvironment(dto);
  }
}

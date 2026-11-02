import { Injectable } from '@nestjs/common';
import { GameApiRespourcesDto } from './dto/GameApiResources.dto.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { GameResourceWhereInput } from '../generated/prisma/models.js';
import { Environment, GameResource } from '../generated/prisma/client.js';

@Injectable()
export class GamesService {
  constructor(private readonly prisma: PrismaService) {}

  private convertResourceContent(content: any, type: string) {
    switch (type) {
      case 'json':
      case 'multiselect':
        return JSON.parse(content);
      case 'boolean':
        return String(
          content === true ||
            content === 1 ||
            content === '1' ||
            content === 'true',
        );
      default:
        return content;
    }
  }

  async getAPIGameResources(dto: GameApiRespourcesDto) {
    const defaultLanguage = 'en';
    const language = dto.language?.trim().toLowerCase() || defaultLanguage;
    const currentEnvironment = dto.env || 'prod';
    const operatorId = dto.operatorID;

    // 1. Obținem jocurile dezactivate pentru operator.
    const disabledGames = await this.prisma.operatorDisabledGames.findMany({
      where: {
        operatorId: operatorId ?? '',
        env: currentEnvironment,
      },
      select: {
        gameId: true,
      },
    });

    const disabledGameIds = [
      ...new Set(disabledGames.map((game) => game.gameId)),
    ];

    // 2. Citim traducerile, dacă limba solicitată nu este engleza.

    const languageResults =
      language !== defaultLanguage && operatorId
        ? await this.prisma.gameResource.findMany({
            where: {
              operatorId,
              language,
              env: currentEnvironment,
            },

            include: {
              gameOperatorFields: {
                select: {
                  fieldType: true,
                  fieldKey: true,
                },
              },
            },
          })
        : [];

    // 3. Construim un Map pentru traduceri.

    const responseLang = new Map<string, unknown>();

    for (const resource of languageResults) {
      const key = [resource.gameId, resource.gameOperatorFields.fieldKey].join(
        '|',
      );
      responseLang.set(
        key,
        this.convertResourceContent(
          resource.content,
          resource.gameOperatorFields.fieldType,
        ),
      );
    }

    // 4. Construim condițiile pentru resursele principale.

    const resourcesWhere: GameResourceWhereInput = {
      language: defaultLanguage,
      env: currentEnvironment,
      ...(operatorId ? { operatorId } : {}),
      gameId: {
        ...(dto.gameID && Number(dto.gameID) > 0
          ? { equals: String(dto.gameID) }
          : {}),
        ...(disabledGameIds.length > 0 ? { notIn: disabledGameIds } : {}),
      },
    };

    // 5. Citim resursele englezești.
    const resources = await this.prisma.gameResource.findMany({
      where: resourcesWhere,
      include: {
        gameOperatorFields: {
          select: {
            fieldType: true,
            fieldKey: true,
          },
        },
      },
    });

    // 6. Construim răspunsul final.
    const response = new Map<string, Record<string, unknown>>();

    for (const resource of resources) {
      const fieldKey = resource.gameOperatorFields.fieldKey;
      const fieldType = resource.gameOperatorFields.fieldType;
      const translationKey = [resource.gameId, fieldKey].join('|');

      const content = responseLang.has(translationKey)
        ? responseLang.get(translationKey)
        : this.convertResourceContent(resource.content, fieldType);
      if (!response.has(resource.gameId)) {
        response.set(resource.gameId, {});
      }
      response.get(resource.gameId)![fieldKey] = content;
    }

    return [...response.values()];
  }
}

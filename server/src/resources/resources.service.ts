import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { Environment } from '../generated/prisma/enums.js';
import { GetGameResourcesDto } from './dto/resources.dto.js';

type GameResourceResult = {
  id: number;
  label: string | null;
  operators: string | null;
};

@Injectable()
export class ResourcesService {
  constructor(private readonly prisma: PrismaService) {}

  async getGames(env: Environment) {
    const gamesWithResourceValuesQuery =
      await this.prisma.gamesResourceValue.findMany({
        select: {
          gameId: true,
        },
        distinct: ['gameId'],
      });
    const gamesWithResourceValues = new Set(
      gamesWithResourceValuesQuery.map((resource) => resource.gameId),
    );

    const games = await this.prisma.game.findMany({
      select: {
        gameId: true,
        title: true,
      },
      where: {
        env,
      },
      distinct: 'gameId',
      orderBy: {
        gameId: 'asc',
      },
    });

    const operatorsByGame = new Map<string, string[]>();
    const operatorRows = await this.prisma.gameResource.findMany({
      select: {
        gameId: true,
        operatorId: true,
      },
      distinct: ['gameId', 'operatorId'],
      where: {
        env,
        gameId: {
          in: games.map((game) => String(game.gameId)),
        },
      },
    });
    for (const row of operatorRows) {
      const key = String(row.gameId);
      const operators = operatorsByGame.get(key);

      if (operators) {
        operators.push(row.operatorId);
      } else {
        operatorsByGame.set(key, [row.operatorId]);
      }
    }

    return games.map((game) => ({
      ...game,
      operators: operatorsByGame.get(String(game.gameId)) ?? [],
      has_game_resource_values: gamesWithResourceValues.has(String(game.gameId))
        ? 1
        : 0,
    }));
  }

  async getLanguages(): Promise<string[]> {
    const languages = await this.prisma.gamesResourceValue.findMany({
      where: {
        language: {
          not: null,

          notIn: [''],
        },
      },
      select: {
        language: true,
      },
      distinct: ['language'],
      orderBy: {
        language: 'asc',
      },
    });

    return languages.map(({ language }) => language!);
  }

  async getOperatorFields(operatorID: string) {
    if (typeof operatorID !== 'string' || operatorID.trim().length === 0) {
      throw new BadRequestException('operatorID is required');
    }
    const fields = await this.prisma.gameOperatorField.findMany({
      where: {
        operatorID,
      },

      include: {
        mapping: {
          select: {
            gameResourceTypeId: true,
            extraOptions: true,
          },
        },
      },
    });

    return fields.map(({ mapping, ...field }) => ({
      ...field,
      gameResourceTypeId: mapping?.gameResourceTypeId ?? null,
      extraOptions: mapping?.extraOptions ?? null,
    }));
  }

  async getGameResources(query: GetGameResourcesDto, env: string) {
    env = env.toLowerCase();
    const language = (query.language ?? 'en').trim().toLowerCase();
    const defaultLanguage = 'en';

    return this.prisma.$queryRaw`
    SELECT
      gr.id,
      gof.id AS field_id,
      gof.field_label,
      gof.field_key,
      gof.field_type,
      gof.field_values,
      COALESCE(
        gr.content,
        requested_values.field_value,
        legacy_values.field_value,
        default_values.field_value,
        ''
      ) AS content,
      gofm.game_resource_type_id,
      CASE
        WHEN gr.id IS NOT NULL
          THEN 'manual'
        WHEN requested_values.id IS NOT NULL
          OR legacy_values.id IS NOT NULL
          OR default_values.id IS NOT NULL
          THEN 'generic'
        ELSE 'empty'
      END AS source,
      CASE
        WHEN gr.id IS NULL
          AND (
            requested_values.id IS NOT NULL
            OR legacy_values.id IS NOT NULL
            OR default_values.id IS NOT NULL
          )
          THEN 1
        ELSE 0
      END AS is_default,
      ${query.gameID} AS game_id,
      ${query.operatorID} AS operator_id,
      ${language} AS language

    FROM game_operator_fields gof
    /* MANUAL VALUE */
    LEFT JOIN game_resources gr
      ON gof.id = gr.field_id
      AND gr.game_id = ${query.gameID}
      AND gr.operator_id = ${query.operatorID}
      AND gr.language = ${language}
      AND gr.env = ${env}

    /* FIELD -> GENERIC RESOURCE TYPE */
    LEFT JOIN game_operator_field_mappings gofm
      ON gof.id = gofm.operator_field_id
    /* REQUESTED LANGUAGE */
    LEFT JOIN (
      SELECT grv.*
      FROM games_resources_values grv
      INNER JOIN (
        SELECT MAX(id) AS id
        FROM games_resources_values
        WHERE game_id = ${query.gameID}
          AND LOWER(TRIM(language)) = ${language}
        GROUP BY
          game_id,
          game_resources_field_id
      ) latest
        ON grv.id = latest.id
    ) requested_values
      ON gofm.game_resource_type_id =
         requested_values.game_resources_field_id

    /* LEGACY VALUE */
    LEFT JOIN (
      SELECT grv.*
      FROM games_resources_values grv
      INNER JOIN (
        SELECT MAX(id) AS id
        FROM games_resources_values
        WHERE game_id = ${query.gameID}
          AND (
            language IS NULL
            OR language = ''
          )
        GROUP BY
          game_id,
          game_resources_field_id
      ) latest
        ON grv.id = latest.id
    ) legacy_values

      ON gofm.game_resource_type_id = legacy_values.game_resources_field_id

    /* DEFAULT ENGLISH */
    LEFT JOIN (
      SELECT grv.*
      FROM games_resources_values grv
      INNER JOIN (
        SELECT MAX(id) AS id
        FROM games_resources_values
        WHERE game_id = ${query.gameID}
          AND LOWER(TRIM(language)) = ${defaultLanguage}
        GROUP BY
          game_id,
          game_resources_field_id
      ) latest
        ON grv.id = latest.id
    ) default_values
      ON gofm.game_resource_type_id =
         default_values.game_resources_field_id
    WHERE gof.operatorID = ${query.operatorID}
  `;
  }

  async getGameResourceTypeOptions() {
    return this.prisma.gameResourceType.findMany({
      select: {
        id: true,
        fieldKey: true,
        fieldLabel: true,
        fieldType: true,
      },
      orderBy: {
        fieldLabel: 'asc',
      },
    });
  }
}

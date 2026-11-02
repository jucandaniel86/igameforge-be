import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { Environment } from '../generated/prisma/enums.js';
import { GetGameResourcesDto } from './dto/resources.dto.js';
import { SaveOperatorFieldDto } from './dto/SaveOperatorField.dto.js';
import { GameResource, Prisma } from '../generated/prisma/client.js';
import { GameResourceTypes } from './dto/GameResourceTypes.dto.js';
import { SaveGameSettingsDto } from './dto/SaveGameSettings.dto.js';
import { OperatorActiveGamesDto } from './dto/OperatorActiveGames.dto.js';
import { SaveResourcesDto } from './dto/SaveResources.dto.js';
import { GameResourceCreateManyInput } from '../generated/prisma/models.js';
import { ImportGamesToOperatorDto } from './dto/ImportGamesToOperator.dto.js';
import { CopyOperatorResourcesToEnvironmentDto } from './dto/CopyOperatorResourcesToEnvironment.dto.js';
import { readFile } from 'node:fs/promises';

type GameResourceResult = {
  id: number;
  label: string | null;
  operators: string | null;
};

@Injectable()
export class ResourcesService {
  constructor(private readonly prisma: PrismaService) {}

  // One-off legacy import. No environment filter: template values are shared.
  async importGameTemplates(
    filePath: string,
    options: { dryRun?: boolean; overwriteExisting?: boolean } = {},
  ) {
    const dryRun = options.dryRun ?? true;
    const overwriteExisting = options.overwriteExisting ?? false;
    const input: unknown = JSON.parse(await readFile(filePath, 'utf8'));
    if (
      !Array.isArray(input) ||
      input.some((row) => !row || typeof row !== 'object' || Array.isArray(row))
    ) {
      throw new BadRequestException('Expected a JSON array of game objects');
    }
    const rows = input as Record<string, unknown>[];
    const mapping = {
      game_id: 'game_id',
      name: 'name',
      description: 'description',
      thumbnail: 'thumbnail',
      rtp: 'rtp',
      max_exposure: 'max_exposure',
      volatility: 'volatility',
      max_win: 'max_win',
      demo: 'demo',
    };
    const resourceTypes = await this.prisma.gameResourceType.findMany();
    const typesByKey = new Map(
      resourceTypes.map((type) => [type.fieldKey, type]),
    );
    const missingFields = Object.values(mapping).filter(
      (key) => !typesByKey.has(key),
    );
    if (missingFields.length) {
      throw new BadRequestException(
        `Missing resource types: ${missingFields.join(', ')}`,
      );
    }
    const report = {
      dryRun,
      overwriteExisting,
      sourceRows: rows.length,
      uniqueGames: 0,
      skippedInvalidGameIds: 0,
      duplicateRows: 0,
      skippedEmptyValues: 0,
      skippedExistingValues: 0,
      plannedValues: 0,
      writtenValues: 0,
      issues: [] as {
        gameId: string;
        fieldKey: string;
        value: unknown;
        reason: string;
      }[],
    };
    const games = new Map<string, Record<string, unknown>>();
    const timestamp = (row: Record<string, unknown>) => {
      const value = Date.parse(
        String(row.updated_at ?? row.created_at ?? '').replace(' ', 'T') + 'Z',
      );
      return Number.isNaN(value) ? 0 : value;
    };
    for (const row of rows) {
      const gameId = String(row.game_id ?? '');
      if (!/^[1-9]\d*$/.test(gameId)) {
        report.skippedInvalidGameIds++;
        continue;
      }
      const previous = games.get(gameId);
      if (previous) {
        report.duplicateRows++;
        const dateDifference = timestamp(row) - timestamp(previous);
        if (
          dateDifference < 0 ||
          (dateDifference === 0 &&
            Number(row.id ?? 0) <= Number(previous.id ?? 0))
        )
          continue;
      }
      games.set(gameId, row);
    }
    report.uniqueGames = games.size;
    if (!games.size) return report;

    const existing = await this.prisma.gamesResourceValue.findMany({
      where: { gameId: { in: [...games.keys()] }, language: 'en' },
      select: { gameId: true, gameResourcesFieldId: true, fieldValue: true },
    });
    const existingValues = new Map(
      existing.map((value) => [
        `${value.gameId}:${value.gameResourcesFieldId}`,
        value.fieldValue,
      ]),
    );
    const plans = new Map<string, { fieldId: bigint; value: string }[]>();
    for (const [gameId, game] of games) {
      const values: { fieldId: bigint; value: string }[] = [];
      for (const [sourceKey, fieldKey] of Object.entries(mapping)) {
        const raw = game[sourceKey];
        if (raw == null || String(raw).trim() === '') {
          report.skippedEmptyValues++;
          continue;
        }
        const type = typesByKey.get(fieldKey)!;
        let value = String(raw).trim();
        let reason = '';
        if (typeof raw === 'object') reason = 'Expected a scalar value';
        else if (type.fieldType === 'boolean') {
          if (raw === true || value === '1') value = '1';
          else if (raw === false || value === '0') value = '0';
          else reason = 'Expected 0 or 1';
        } else if (type.fieldType === 'number') {
          if (fieldKey === 'rtp') {
            value = value.replace(/%$/, '').trim();
            if (/^\d+,\d+$/.test(value)) value = value.replace(',', '.');
          }
          if (fieldKey === 'max_exposure') {
            value = value.replace(/^\$\s*/, '');
            if (/^\d{1,3}(,\d{3})+(\.\d+)?$/.test(value))
              value = value.replaceAll(',', '');
          }
          if (!/^-?\d+(\.\d+)?$/.test(value) || !Number.isFinite(Number(value)))
            reason = 'Invalid numeric value';
          else if (
            fieldKey === 'rtp' &&
            (Number(value) < 0 || Number(value) > 100)
          )
            reason = 'RTP outside 0–100';
        } else if (type.fieldType === 'select') {
          const allowed = (type.fieldValues ?? '')
            .split(',')
            .map((option) => option.trim());
          value = value.toLowerCase();
          if (!allowed.includes(value)) reason = 'Value is not in fieldValues';
        }
        if (reason) {
          report.issues.push({ gameId, fieldKey, value: raw, reason });
          continue;
        }
        const previous = existingValues.get(`${gameId}:${type.id}`);
        if (!overwriteExisting && previous != null && previous.trim() !== '') {
          report.skippedExistingValues++;
          continue;
        }
        values.push({ fieldId: type.id, value });
        report.plannedValues++;
      }
      if (values.length) plans.set(gameId, values);
    }
    if (dryRun) return report;

    // Commit one game at a time; a retry safely resumes after partial progress.
    for (const [gameId, values] of plans) {
      const written = await this.prisma.$transaction(async (tx) => {
        let count = 0;
        for (const { fieldId, value } of values) {
          const where = {
            gameId_gameResourcesFieldId_language: {
              gameId,
              gameResourcesFieldId: fieldId,
              language: 'en',
            },
          };
          const current = await tx.gamesResourceValue.findUnique({ where });
          if (!overwriteExisting && current?.fieldValue?.trim()) continue;
          await tx.gamesResourceValue.upsert({
            where,
            create: {
              gameId,
              gameResourcesFieldId: fieldId,
              language: 'en',
              fieldValue: value,
            },
            update: { fieldValue: value },
          });
          count++;
        }
        return count;
      });
      report.writtenValues += written;
    }
    return report;
  }

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
        fieldValues: true,
      },
      orderBy: {
        fieldPriority: 'asc',
      },
    });
  }

  async saveOperatorField(dto: SaveOperatorFieldDto) {
    const { id, gameResourceTypeId, extraOptions, ...fieldData } = dto;

    const fieldId = await this.prisma.$transaction(async (tx) => {
      const field =
        id && id > 0
          ? await tx.gameOperatorField.update({
              where: { id: BigInt(id) },
              data: fieldData,
            })
          : await tx.gameOperatorField.create({
              data: fieldData,
            });

      if (gameResourceTypeId) {
        await tx.gameOperatorFieldMapping.upsert({
          where: { operatorFieldId: field.id },

          create: {
            operatorFieldId: field.id,
            gameResourceTypeId,
            extraOptions: extraOptions ?? undefined,
          },

          update: {
            gameResourceTypeId,
            extraOptions: extraOptions ?? undefined,
          },
        });
      } else {
        await tx.gameOperatorFieldMapping.deleteMany({
          where: { operatorFieldId: field.id },
        });
      }
      return field.id;
    });

    return this.getOperatorFieldWithMapping(fieldId);
  }

  private async getOperatorFieldWithMapping(fieldId: bigint) {
    const field = await this.prisma.gameOperatorField.findUnique({
      where: {
        id: fieldId,
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

    if (!field) {
      throw new NotFoundException('Operator field not found');
    }

    const { mapping, ...fieldData } = field;

    return {
      ...fieldData,
      gameResourceTypeId: mapping?.gameResourceTypeId ?? null,
      extraOptions: mapping?.extraOptions ?? null,
    };
  }

  async deleteOperatorFields(fieldId: bigint) {
    return this.prisma.$transaction(async (tx) => {
      await tx.gameOperatorFieldMapping.deleteMany({
        where: {
          operatorFieldId: fieldId,
        },
      });
      return tx.gameOperatorField.delete({
        where: {
          id: fieldId,
        },
      });
    });
  }

  async getGameResourceTypes(dto: GameResourceTypes) {
    const language = dto.language?.toLowerCase() ?? 'en';
    const defaultLanguage = 'en';

    const gameId = BigInt(dto.game_id);

    // 1. Preluăm toate tipurile de câmpuri disponibile.
    const resourceTypes = await this.prisma.gameResourceType.findMany({
      orderBy: {
        fieldPriority: 'asc',
      },
      select: {
        id: true,
        fieldKey: true,
        fieldLabel: true,
        fieldType: true,
        fieldValues: true,
      },
    });

    // 2. Preluăm valorile existente pentru jocul solicitat.
    // Sortăm descrescător după ID pentru a păstra cea mai nouă valoare.
    const values = await this.prisma.gamesResourceValue.findMany({
      where: {
        gameId: String(gameId),
      },
      orderBy: {
        id: 'desc',
      },
      select: {
        gameResourcesFieldId: true,
        language: true,
        fieldValue: true,
      },
    });

    // 3. Grupăm valorile după câmp și limbă.
    const valuesByField = new Map<string, Map<string, string | null>>();

    for (const value of values) {
      const fieldId = value.gameResourcesFieldId.toString();
      const valueLanguage = value.language?.trim().toLowerCase() || 'legacy';

      if (!valuesByField.has(fieldId)) {
        valuesByField.set(fieldId, new Map());
      }

      const translations = valuesByField.get(fieldId)!;
      // Păstrăm prima valoare întâlnită.
      // Deoarece valorile sunt sortate DESC, aceasta are ID-ul cel mai mare.
      if (!translations.has(valueLanguage)) {
        translations.set(valueLanguage, value.fieldValue);
      }
    }

    // 4. Construim rezultatul cu fallback între limbi.
    return resourceTypes.map((resourceType) => {
      const translations = valuesByField.get(resourceType.id.toString());

      const fieldValue =
        translations?.get(language) ??
        translations?.get('legacy') ??
        translations?.get(defaultLanguage) ??
        '';

      return {
        id: resourceType.id,
        fieldKey: resourceType.fieldKey,
        fieldLabel: resourceType.fieldLabel,
        fieldType: resourceType.fieldType,
        fieldValue: fieldValue,
        fieldValues: resourceType.fieldValues,
      };
    });
  }

  async getGamesTemplates(env: Environment) {
    const defaultLanguage = 'en';

    const games = await this.prisma.game.findMany({
      where: { env, gameId: { not: null } },
      select: { gameId: true },
      distinct: ['gameId'],
      orderBy: { gameId: 'asc' },
    });
    const gameIds = games.map((game) => String(game.gameId));

    if (!gameIds.length) return [];

    // 1. Preluăm toate tipurile de câmpuri disponibile.
    const resourceTypes = await this.prisma.gameResourceType.findMany({
      orderBy: {
        fieldPriority: 'asc',
      },
      select: {
        id: true,
        fieldKey: true,
        fieldLabel: true,
        fieldType: true,
        fieldValues: true,
      },
    });

    // 2. Preluăm template-urile doar pentru jocurile din mediul curent.
    // Sortăm descrescător după ID pentru a păstra cea mai nouă valoare.
    const gameTemplates = await this.prisma.gamesResourceValue.findMany({
      orderBy: {
        id: 'desc',
      },
      where: {
        language: defaultLanguage,
        gameId: { in: gameIds },
      },
      select: {
        gameResourcesFieldId: true,
        language: true,
        fieldValue: true,
        gameId: true,
      },
    });

    const gamesMap = new Map<
      string,
      {
        gameId: string;
        fields: { fieldKey: string; fieldValue: string | null }[];
      }
    >();

    for (const gameId of gameIds) {
      gamesMap.set(gameId, { gameId, fields: [] });
    }

    const fieldKeys = new Map(
      resourceTypes.map((resourceType) => [
        resourceType.id,
        resourceType.fieldKey,
      ]),
    );

    for (const template of gameTemplates) {
      const fieldKey = fieldKeys.get(template.gameResourcesFieldId);

      if (!fieldKey) continue;

      const game = gamesMap.get(template.gameId)!;

      // Evităm duplicatele: păstrăm prima valoare (cel mai nou ID)
      if (!game.fields.some((field) => field.fieldKey === fieldKey)) {
        game.fields.push({
          fieldKey,
          fieldValue: template.fieldValue,
        });
      }
    }

    const result = Array.from(gamesMap.values());

    return result;
  }

  async saveGameSettings(dto: SaveGameSettingsDto) {
    const language = dto.language?.trim().toLowerCase() || 'en';
    const gameId = String(dto.game_id);

    if (!dto.fields.length) {
      throw new BadRequestException('Fields array cannot be empty');
    }

    await this.prisma.$transaction(
      dto.fields.map((field) =>
        this.prisma.gamesResourceValue.upsert({
          where: {
            gameId_gameResourcesFieldId_language: {
              gameId,
              gameResourcesFieldId: BigInt(field.game_resources_field_id),
              language,
            },
          },
          create: {
            gameId,
            gameResourcesFieldId: BigInt(field.game_resources_field_id),
            language,
            fieldValue: field.field_value ?? '',
          },
          update: {
            fieldValue: field.field_value ?? '',
          },
        }),
      ),
    );

    return true;
  }

  async operatorActiveGames(dto: OperatorActiveGamesDto) {
    return await this.prisma.operatorDisabledGames.findMany({
      where: {
        operatorId: dto.operatorID,
        env: dto.env,
        gameId: dto.gameID,
      },
    });
  }

  async saveOperatorActiveGames(
    dto: OperatorActiveGamesDto,
  ): Promise<{ saved: boolean }> {
    const { operatorID, env, gameID } = dto;

    const where = {
      operatorId_env_gameId: {
        operatorId: operatorID,
        env,
        gameId: gameID,
      },
    };

    await this.prisma.$transaction(async (tx) => {
      const game = await tx.operatorDisabledGames.findUnique({
        where,
      });

      if (game) {
        await tx.operatorDisabledGames.delete({
          where,
        });
      } else {
        await tx.operatorDisabledGames.create({
          data: {
            operatorId: operatorID,
            env,
            gameId: gameID,
          },
        });
      }
    });

    return { saved: true };
  }

  private formatResource(content: unknown, type: string): string {
    switch (type) {
      case 'boolean':
        return String(
          content === true ||
            content === 1 ||
            content === '1' ||
            content === 'true',
        );

      default:
        return String(content ?? '');
    }
  }

  async saveBulkGameResources(
    dto: SaveResourcesDto,

    env: Environment,
  ): Promise<boolean> {
    const { fields, game_id, operator_id } = dto;

    if (!fields.length) {
      throw new BadRequestException('Fields array cannot be empty');
    }

    for (const field of fields) {
      if (field.game_id !== game_id || field.operator_id !== operator_id) {
        throw new BadRequestException(
          'All fields must belong to the requested game and operator',
        );
      }
    }

    const fieldIds = [
      ...new Set(fields.map((field) => BigInt(field.field_id))),
    ];

    const fieldTypes = await this.prisma.gameOperatorField.findMany({
      where: {
        id: {
          in: fieldIds,
        },
      },
      select: {
        id: true,
        fieldType: true,
      },
    });

    const fieldTypesMap = new Map(
      fieldTypes.map((field) => [field.id.toString(), field.fieldType]),
    );

    for (const field of fields) {
      if (!fieldTypesMap.has(field.field_id)) {
        throw new BadRequestException(`Invalid field_id: ${field.field_id}`);
      }
    }

    const resourcesToSave = fields.map((field) => ({
      gameId: game_id,
      operatorId: operator_id,
      fieldId: Number(field.field_id),
      language: dto.language.trim().toLowerCase(),
      content: this.formatResource(
        field.content,
        fieldTypesMap.get(field.field_id)!,
      ),
      env,
    }));

    await this.prisma.$transaction(async (tx) => {
      await tx.gameResource.deleteMany({
        where: {
          gameId: game_id,
          operatorId: operator_id,
          env,
        },
      });

      await tx.gameResource.createMany({
        data: resourcesToSave,
      });
    });

    return true;
  }

  async importGamesToOperator(dto: ImportGamesToOperatorDto): Promise<{
    success: boolean;
    message: string;
    imported_games?: number;
    games_without_generic_template?: number;
    games_without_generic_template_ids?: string[];
  }> {
    const operatorID = dto.operatorID.trim();
    const env = dto.env;

    // 1. Transformăm lista de jocuri într-un array unic.

    const gameIds = [
      ...new Set(
        dto.games
          .split(',')
          .map((gameId) => gameId.trim())
          .filter(Boolean),
      ),
    ];

    if (!gameIds.length) {
      return {
        success: false,
        message: 'No games were selected',
      };
    }

    const operatorFields = await this.prisma.gameOperatorField.findMany({
      where: {
        operatorID,
      },
      select: {
        id: true,
        mapping: {
          select: {
            gameResourceTypeId: true,
          },
        },
      },
    });

    if (!operatorFields.length) {
      return {
        success: false,
        message: 'The selected operator has no configured fields',
      };
    }

    const mappedFields = new Map<string, bigint>();

    for (const field of operatorFields) {
      const genericFieldId = field.mapping?.gameResourceTypeId;

      if (genericFieldId == null) {
        continue;
      }
      mappedFields.set(genericFieldId.toString(), field.id);
    }

    if (!mappedFields.size) {
      return {
        success: false,
        message:
          'The selected operator has no mapped fields for generic game templates',
      };
    }

    const templates = await this.prisma.gamesResourceValue.findMany({
      where: {
        gameId: {
          in: gameIds,
        },
      },
      orderBy: {
        id: 'asc',
      },
      select: {
        gameId: true,
        gameResourcesFieldId: true,
        language: true,
        fieldValue: true,
      },
    });

    const gamesWithTemplates = new Set(
      templates.map((template) => template.gameId),
    );

    const processedKeys = new Set<string>();

    const importedGameIds = new Set<string>();

    const resourcesToImport: Array<{
      gameId: string;
      operatorId: string;
      fieldId: number;
      language: string;
      env: Environment;
      content: string;
    }> = [];

    for (const template of templates) {
      const operatorFieldId = mappedFields.get(
        template.gameResourcesFieldId.toString(),
      );

      if (operatorFieldId === undefined) {
        continue;
      }

      const language = template.language?.trim().toLowerCase() || 'en';

      const fieldId = Number(operatorFieldId);

      const duplicateKey = [
        template.gameId,
        operatorID,
        fieldId,
        language,
        env,
      ].join('|');

      if (processedKeys.has(duplicateKey)) {
        continue;
      }

      processedKeys.add(duplicateKey);
      resourcesToImport.push({
        gameId: template.gameId,
        operatorId: operatorID,
        fieldId,
        language,
        env,
        content: template.fieldValue ?? '',
      });

      importedGameIds.add(template.gameId);
    }

    await this.prisma.$transaction(
      resourcesToImport.map((resource) =>
        this.prisma.gameResource.upsert({
          where: {
            gameId_operatorId_fieldId_language_env: {
              gameId: resource.gameId,
              operatorId: resource.operatorId,
              fieldId: resource.fieldId,
              language: resource.language,
              env: resource.env,
            },
          },
          create: resource,
          update: {
            content: resource.content,
          },
        }),
      ),
    );

    const gamesWithoutTemplates = gameIds.filter(
      (gameId) => !gamesWithTemplates.has(gameId),
    );

    const importedGames = importedGameIds.size;

    return {
      success: true,

      message:
        `Imported games: ${importedGames}. ` +
        `Games without generic game template: ${gamesWithoutTemplates.length}.`,
      imported_games: importedGames,
      games_without_generic_template: gamesWithoutTemplates.length,
      games_without_generic_template_ids: gamesWithoutTemplates,
    };
  }

  private getResourceDuplicateKey(
    resource: Pick<
      GameResource,
      'gameId' | 'operatorId' | 'fieldId' | 'env' | 'language'
    >,
  ): string {
    return [
      resource.gameId,
      resource.operatorId,
      resource.fieldId,
      resource.env,
      resource.language,
    ].join('|');
  }

  async copyOperatorResourcesToEnvironment(
    dto: CopyOperatorResourcesToEnvironmentDto,
  ) {
    const { operatorID, fromEnvironmentID, toEnvironment } = dto;
    const overwriteDuplicates = String(dto.overwriteDuplicates) === '1';

    // 1. Citim resursele din environmentul sursă.
    const resourcesToCopy = await this.prisma.gameResource.findMany({
      where: {
        operatorId: operatorID,
        env: fromEnvironmentID,
      },
    });

    if (resourcesToCopy.length === 0) {
      return {
        success: false,
        message:
          'The selected operator has no resources in the source environment',
      };
    }

    // 2. Identificăm jocurile distincte.

    const gameIds = [
      ...new Set(resourcesToCopy.map((resource) => resource.gameId)),
    ];

    // 3. Executăm toate modificările într-o tranzacție.
    return this.prisma.$transaction(async (tx) => {
      let deletedResources = 0;
      let deletedGames = 0;

      // Set pentru identificarea duplicatelor.
      const existingKeys = new Set<string>();

      // 4. Dacă overwrite este activ, ștergem resursele existente.
      if (overwriteDuplicates) {
        const destinationResources = await tx.gameResource.findMany({
          where: {
            operatorId: operatorID,
            env: toEnvironment,
            gameId: {
              in: gameIds,
            },
          },

          select: {
            id: true,
            gameId: true,
          },
        });

        deletedResources = destinationResources.length;

        deletedGames = new Set(
          destinationResources.map((resource) => resource.gameId),
        ).size;

        if (deletedResources > 0) {
          await tx.gameResource.deleteMany({
            where: {
              id: {
                in: destinationResources.map((resource) => resource.id),
              },
            },
          });
        }
      } else {
        // 5. Dacă overwrite este dezactivat,

        // identificăm resursele deja existente.
        const destinationResources = await tx.gameResource.findMany({
          where: {
            operatorId: operatorID,
            env: toEnvironment,
            gameId: {
              in: gameIds,
            },
          },

          select: {
            gameId: true,
            operatorId: true,
            fieldId: true,
            language: true,
            env: true,
          },
        });

        for (const resource of destinationResources) {
          existingKeys.add(this.getResourceDuplicateKey(resource));
        }
      }

      // 6. Pregătim resursele pentru inserare.
      const resourcesToInsert: Array<{
        gameId: string;
        operatorId: string;
        fieldId: bigint;
        language: string;
        content: string | null;
        env: Environment;
      }> = [];

      const insertedGameIds = new Set<string>();

      for (const resource of resourcesToCopy) {
        const newResource = {
          gameId: resource.gameId,
          operatorId: resource.operatorId,
          fieldId: resource.fieldId,
          language: resource.language,
          content: resource.content,
          env: toEnvironment,
        };

        const duplicateKey = this.getResourceDuplicateKey(newResource);

        if (existingKeys.has(duplicateKey)) {
          continue;
        }
        existingKeys.add(duplicateKey);
        resourcesToInsert.push(newResource);
        insertedGameIds.add(resource.gameId);
      }

      // 7. Inserăm resursele.
      if (resourcesToInsert.length > 0) {
        await tx.gameResource.createMany({
          data: resourcesToInsert,
        });
      }

      // 8. Returnăm statisticile.
      const importedGames = insertedGameIds.size;
      return {
        success: true,
        message:
          `Imported games: ${importedGames}. ` +
          `Deleted games: ${deletedGames}.`,
        imported_games: importedGames,
        inserted_resources: resourcesToInsert.length,
        deleted_games: deletedGames,
        deleted_resources: deletedResources,
      };
    });
  }

}

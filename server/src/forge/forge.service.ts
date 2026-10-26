import {
  BadGatewayException,
  ConflictException,
  Injectable,
  Logger,
} from '@nestjs/common';

import { PrismaService } from '../prisma/prisma.service.js';
import {
  Environment,
  CronType,
  ContractType,
} from '../generated/prisma/enums.js';
import { ForgeApiService } from './forge-api.service.js';

import type { ForgeGame } from './types/forge.types.js';
import { Prisma } from '../generated/prisma/client.js';
import type { ForgeOperator } from './types/forge.types.js';

type OperatorRow = {
  rgsId: string;
  siteId: string;
  name: string;
  brands: number[];
  env: Environment;
};

type SyncResult = {
  total_inserted: number;
  total_updated: number;
  total_skipped: number;
};

type GameRow = {
  siteId: string;
  brandId: string;
  gameId: number;
  title: string | null;
  provider: string | null;
  theoreticalRtp: number | null;
  rtpSd: number | null;
  env: Environment;
};

@Injectable()
export class ForgeService {
  private readonly logger = new Logger(ForgeService.name);
  private readonly runningSyncs = new Set<string>();

  constructor(
    private readonly prisma: PrismaService,
    private readonly forgeApi: ForgeApiService,
  ) {}

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  private normalizeGame(game: ForgeGame, env: Environment): GameRow | null {
    if (
      game.siteId == null ||
      game.gameId == null ||
      !Number.isInteger(Number(game.gameId))
    ) {
      return null;
    }

    let info: Record<string, unknown> = {};

    try {
      const parsed =
        typeof game.info === 'string' ? JSON.parse(game.info) : game.info;

      if (parsed && typeof parsed === 'object') {
        info = parsed as Record<string, unknown>;
      }
    } catch {
      // Invalid JSON: import the game without RTP data.
    }

    const toNumber = (value: unknown): number | null => {
      if (value == null || value === '') return null;

      const parsed = Number(value);

      return Number.isFinite(parsed) ? parsed : null;
    };

    return {
      siteId: String(game.siteId),
      brandId: String(game.brandId ?? '0'),
      gameId: Number(game.gameId),
      title: game.title ?? null,
      provider: game.provider ?? null,
      theoreticalRtp: toNumber(info.rtp),
      rtpSd: toNumber(info.standardDeviation),
      env,
    };
  }

  private normalizeOperator(
    operator: ForgeOperator,

    env: Environment,
  ): OperatorRow | null {
    if (
      operator.id == null ||
      operator.siteId == null ||
      operator.siteId === ''
    ) {
      return null;
    }

    return {
      rgsId: String(operator.id),
      siteId: String(operator.siteId),
      name: operator.name ?? '',
      brands: operator.brandIds ?? [],
      env,
    };
  }

  async syncGames(env: Environment): Promise<SyncResult> {
    const lockKey = `games:${env}`;

    if (this.runningSyncs.has(lockKey)) {
      throw new ConflictException(
        `Games synchronization already running for ${env}`,
      );
    }

    this.runningSyncs.add(lockKey);

    const result: SyncResult = {
      total_inserted: 0,
      total_updated: 0,
      total_skipped: 0,
    };

    try {
      const take = 500;

      const firstPage = await this.forgeApi.getGames(env, 0, take);

      if (
        !firstPage ||
        !Array.isArray(firstPage.items) ||
        !Number.isInteger(firstPage.totalCount) ||
        firstPage.totalCount < 0
      ) {
        throw new BadGatewayException('Invalid Forge games response');
      }

      const totalPages = Math.ceil(firstPage.totalCount / take);

      this.logger.log(
        `Starting Forge games sync: env=${env}, total=${firstPage.totalCount}`,
      );

      for (let page = 0; page < totalPages; page++) {
        const response =
          page === 0
            ? firstPage
            : await this.forgeApi.getGames(env, page * take, take);

        if (!response || !Array.isArray(response.items)) {
          throw new BadGatewayException(
            `Invalid Forge response on page ${page + 1}`,
          );
        }

        const uniqueGames = new Map<string, GameRow>();

        for (const game of response.items) {
          const normalized = this.normalizeGame(game, env);

          if (!normalized) {
            result.total_skipped++;
            continue;
          }

          const key = JSON.stringify([
            normalized.siteId,
            normalized.brandId,
            normalized.gameId,
            normalized.env,
          ]);

          if (uniqueGames.has(key)) {
            result.total_skipped++;
          }

          uniqueGames.set(key, normalized);
        }

        const rows = [...uniqueGames.values()];

        if (rows.length > 0) {
          const counts = await this.saveGamesBatch(rows);

          result.total_inserted += counts.inserted;
          result.total_updated += counts.updated;
        }

        this.logger.log(
          `Forge games ${env}: ${page + 1}/${totalPages} pages completed`,
        );

        if (page < totalPages - 1) {
          await this.sleep(300);
        }
      }

      await this.prisma.cron.create({
        data: {
          addedAt: new Date(),
          cronType: CronType.forge_api,
          totalInserted: result.total_inserted,
          totalUpdated: result.total_updated,
          success: 1,
          details: JSON.stringify({ type: 'games' }),
          env,
        },
      });

      this.logger.log(
        `Forge games sync completed: ${env}, inserted=${result.total_inserted}, updated=${result.total_updated}`,
      );

      return result;
    } catch (error) {
      this.logger.error(
        `Forge games sync failed: env=${env}`,
        error instanceof Error ? error.stack : String(error),
      );

      try {
        await this.prisma.cron.create({
          data: {
            addedAt: new Date(),
            cronType: CronType.forge_api,
            totalInserted: result.total_inserted,
            totalUpdated: result.total_updated,
            success: 0,
            details: JSON.stringify({ type: 'games' }),
            env,
          },
        });
      } catch (logError) {
        this.logger.error(
          'Failed to save Forge sync failure history',
          logError instanceof Error ? logError.stack : String(logError),
        );
      }

      throw error;
    } finally {
      this.runningSyncs.delete(lockKey);
    }
  }

  private async saveGamesBatch(
    rows: GameRow[],
  ): Promise<{ inserted: number; updated: number }> {
    if (rows.length === 0) {
      return { inserted: 0, updated: 0 };
    }

    return this.prisma.$transaction(async (tx) => {
      // 1. Identificăm jocurile existente înainte de upsert.
      const keys = Prisma.join(
        rows.map(
          (row) =>
            Prisma.sql`(
          ${row.siteId},
          ${row.brandId},
          ${row.gameId},
          ${row.env}
        )`,
        ),
      );

      const existing = await tx.$queryRaw<
        Array<{
          siteId: string;
          brandId: string;
          gameId: number;
          env: string;
        }>
      >`
      SELECT
        site_id AS siteId,
        brand_id AS brandId,
        game_id AS gameId,
        env
      FROM games
      WHERE (site_id, brand_id, game_id, env)
      IN (${keys})
    `;

      // 2. Construim un Set pentru identificare rapidă.
      const existingKeys = new Set(
        existing.map((game) =>
          JSON.stringify([game.siteId, game.brandId, game.gameId, game.env]),
        ),
      );

      let inserted = 0;
      let updated = 0;

      for (const row of rows) {
        const key = JSON.stringify([
          row.siteId,
          row.brandId,
          row.gameId,
          row.env,
        ]);

        if (existingKeys.has(key)) {
          updated++;
        } else {
          inserted++;
        }
      }

      // 3. Construim valorile pentru bulk insert.
      const values = Prisma.join(
        rows.map(
          (row) =>
            Prisma.sql`(
          ${row.siteId},
          ${row.brandId},
          ${row.gameId},
          ${row.title},
          ${row.provider},
          ${row.theoreticalRtp},
          ${row.rtpSd},
          ${row.env}
        )`,
        ),
      );

      // 4. Executăm bulk upsert.
      await tx.$executeRaw`
      INSERT INTO games (
        site_id,
        brand_id,
        game_id,
        title,
        provider,
        theoretical_rtp,
        rtp_sd,
        env
      )
      VALUES ${values}
      ON DUPLICATE KEY UPDATE
        title = VALUES(title),
        provider = VALUES(provider),
        theoretical_rtp = VALUES(theoretical_rtp),
        rtp_sd = VALUES(rtp_sd)
    `;

      return { inserted, updated };
    });
  }

  async getLastUpdates() {
    const environments = Object.values(Environment);

    const crons = await this.prisma.cron.findMany({
      where: {
        cronType: CronType.forge_api,
        env: {
          in: environments,
        },
      },
      orderBy: [{ addedAt: 'desc' }, { id: 'desc' }],
      select: {
        id: true,
        addedAt: true,
        totalInserted: true,
        totalUpdated: true,
        success: true,
        details: true,
        env: true,
      },
    });

    type SyncType = 'games' | 'operators';

    type ResultEnvironmentType = {
      added_at: Date;
      env: Environment;
      total_inserted: number | null;
      total_updated: number | null;
    };

    const result: {
      games: ResultEnvironmentType[];
      operators: ResultEnvironmentType[];
    } = {
      games: [],
      operators: [],
    };

    for (const cron of crons) {
      if (!cron.env) continue;

      let details: { type?: string };

      try {
        details = JSON.parse(cron.details ?? '{}');
      } catch {
        continue;
      }

      if (details.type !== 'games' && details.type !== 'operators') {
        continue;
      }

      const type = details.type as SyncType;

      // Avem deja ultima sincronizare pentru acest environment și tip.
      if (result[type].find((element) => element.env === cron.env)) {
        continue;
      }

      result[type].push({
        added_at: cron.addedAt,
        env: cron.env,
        total_inserted: cron.totalInserted,
        total_updated: cron.totalUpdated,
      });
    }

    return result;
  }

  private async saveOperatorsBatch(
    rows: OperatorRow[],
  ): Promise<{ inserted: number; updated: number }> {
    if (rows.length === 0) {
      return { inserted: 0, updated: 0 };
    }

    return this.prisma.$transaction(async (tx) => {
      const env = rows[0].env;

      const existingOperators = await tx.operator.findMany({
        where: {
          env,
          rgsId: {
            in: rows.map((row) => row.rgsId),
          },
        },

        select: {
          id: true,
          rgsId: true,
        },
      });

      const existingMap = new Map(
        existingOperators.map((operator) => [operator.rgsId, operator.id]),
      );

      const toInsert: OperatorRow[] = [];

      const toUpdate: Array<{
        id: bigint;
        row: OperatorRow;
      }> = [];

      for (const row of rows) {
        const existingId = existingMap.get(row.rgsId);

        if (existingId !== undefined) {
          toUpdate.push({
            id: existingId,
            row,
          });
        } else {
          toInsert.push(row);
        }
      }

      if (toInsert.length > 0) {
        await tx.operator.createMany({
          data: toInsert.map((row) => ({
            rgsId: row.rgsId,
            siteId: row.siteId,
            name: row.name,
            brands: row.brands,
            env: row.env,
            contractType: ContractType.REV,
            createdAt: new Date(),
          })),
        });
      }

      for (const { id, row } of toUpdate) {
        await tx.operator.update({
          where: { id },
          data: {
            name: row.name,
            brands: row.brands,
          },
        });
      }

      return {
        inserted: toInsert.length,
        updated: toUpdate.length,
      };
    });
  }

  async syncOperators(env: Environment): Promise<SyncResult> {
    const lockKey = `operators:${env}`;

    if (this.runningSyncs.has(lockKey)) {
      throw new ConflictException(
        `Operators synchronization already running for ${env}`,
      );
    }

    this.runningSyncs.add(lockKey);

    const result: SyncResult = {
      total_inserted: 0,
      total_updated: 0,
      total_skipped: 0,
    };

    try {
      const response = await this.forgeApi.getOperators(env);

      if (!response || !Array.isArray(response.items)) {
        throw new BadGatewayException('Invalid Forge operators response');
      }

      const uniqueOperators = new Map<string, OperatorRow>();

      for (const operator of response.items) {
        const normalized = this.normalizeOperator(operator, env);

        if (!normalized) {
          result.total_skipped++;
          continue;
        }

        if (uniqueOperators.has(normalized.rgsId)) {
          result.total_skipped++;
        }
        uniqueOperators.set(normalized.rgsId, normalized);
      }

      const rows = [...uniqueOperators.values()];

      if (rows.length > 0) {
        const counts = await this.saveOperatorsBatch(rows);
        result.total_inserted = counts.inserted;
        result.total_updated = counts.updated;
      }

      await this.prisma.cron.create({
        data: {
          addedAt: new Date(),
          cronType: CronType.forge_api,
          totalInserted: result.total_inserted,
          totalUpdated: result.total_updated,
          success: 1,
          details: JSON.stringify({ type: 'operators' }),
          env,
        },
      });

      return result;
    } catch (error) {
      this.logger.error(
        `Forge operators sync failed: env=${env}`,
        error instanceof Error ? error.stack : String(error),
      );

      try {
        await this.prisma.cron.create({
          data: {
            addedAt: new Date(),
            cronType: CronType.forge_api,
            totalInserted: result.total_inserted,
            totalUpdated: result.total_updated,
            success: 0,
            details: JSON.stringify({ type: 'operators' }),
            env,
          },
        });
      } catch (logError) {
        this.logger.error(
          'Failed to save Forge operators sync failure history',
          logError instanceof Error ? logError.stack : String(logError),
        );
      }

      throw error;
    } finally {
      this.runningSyncs.delete(lockKey);
    }
  }
}

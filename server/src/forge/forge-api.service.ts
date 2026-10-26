import { BadGatewayException, Injectable, Logger } from '@nestjs/common';
import { AxiosError } from 'axios';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { Environment } from '../generated/prisma/enums.js';
import {
  ForgeGamesResponse,
  ForgeOperatorsResponse,
} from './types/forge.types.js';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class ForgeApiService {
  constructor(
    private readonly config: ConfigService,
    private readonly http: HttpService,
  ) {}

  private readonly tokens = new Map<Environment, string>();
  private readonly logger = new Logger(ForgeApiService.name);

  private getConfiguration(env: Environment) {
    const endpointKeys: Record<Environment, string> = {
      [Environment.dev]: 'IGAMEFORGE_DEV_ENDPOINT',
      [Environment.uat]: 'IGAMEFORGE_UAT_ENDPOINT',
      [Environment.prod]: 'IGAMEFORGE_PROD_ENDPOINT',
      [Environment.prng]: 'IGAMEFORGE_PRNG_PROD_ENDPOINT',
    };

    return {
      endpoint: this.config.getOrThrow<string>(endpointKeys[env]),
      clientId: this.config.getOrThrow<string>(
        env === Environment.prng
          ? 'IGAMEFORGE_PRNG_CLIENT_ID'
          : 'IGAMEFORGE_CLIENT_ID',
      ),
      clientSecret: this.config.getOrThrow<string>(
        env === Environment.prng
          ? 'IGAMEFORGE_PRNG_CLIENT_SECRET'
          : 'IGAMEFORGE_CLIENT_SECRET',
      ),
    };
  }

  private async getToken(env: Environment): Promise<string> {
    const cachedToken = this.tokens.get(env);

    if (cachedToken) {
      return cachedToken;
    }

    const token = await this.login(env);

    this.tokens.set(env, token);

    return token;
  }

  private buildUrl(baseUrl: string, path: string): string {
    const normalizedBase = baseUrl.replace(/\/+$/, '') + '/';

    return new URL(path, normalizedBase).toString();
  }

  private async login(env: Environment): Promise<string> {
    const configuration = this.getConfiguration(env);

    const response = await firstValueFrom(
      this.http.post<{ token: string }>(
        this.buildUrl(configuration.endpoint, 'rpt/login'),
        {
          client_id: configuration.clientId,
          client_secret: configuration.clientSecret,
        },
      ),
    );

    if (!response.data?.token) {
      throw new BadGatewayException('Forge login failed');
    }

    return response.data.token;
  }

  private async request<T>(
    env: Environment,
    path: string,
    params: Record<string, unknown>,
  ): Promise<T> {
    try {
      const token = await this.getToken(env);
      const configuration = this.getConfiguration(env);

      const response = await firstValueFrom(
        this.http.post<T>(this.buildUrl(configuration.endpoint, path), params, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }),
      );

      return response.data;
    } catch (error) {
      if (error instanceof AxiosError) {
        this.logger.error(
          `Forge request failed: env=${env}, path=${path}, status=${error.response?.status}`,
        );
        throw new BadGatewayException(`Forge API request failed for ${env}`);
      }

      throw error;
    }
  }

  async getGames(env: Environment, skip = 0, take = 500) {
    return this.request<ForgeGamesResponse>(env, 'rpt/operatorgames/query', {
      returnTotalCount: true,
      returnDetails: true,
      skip,
      take,
    });
  }

  async getOperators(env: Environment, skip = 0, take = 1000) {
    return this.request<ForgeOperatorsResponse>(env, 'rpt/operators/query', {
      returnTotalCount: true,
      returnDetails: true,
      skip,
      take,
    });
  }
}

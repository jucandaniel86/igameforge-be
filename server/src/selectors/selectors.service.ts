import { Injectable } from '@nestjs/common';
import { Environment } from '../generated/prisma/enums.js';

@Injectable()
export class SelectorsService {
  getEnvironments() {
    return Object.entries(Environment).map((env, val) => ({
      id: env[0],
      label: String(env[0]).toUpperCase(),
    }));
  }
}

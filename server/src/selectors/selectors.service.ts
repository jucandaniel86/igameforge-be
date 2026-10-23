import { Injectable } from '@nestjs/common';
import { Environment } from '../generated/prisma/enums.js';

@Injectable()
export class SelectorsService {
  getEnvironments() {
    return Object.entries(Environment).map((env) => ({
      id: env,
      label: String(env).toUpperCase(),
    }));
  }
}

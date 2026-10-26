import { Module } from '@nestjs/common';

import { HttpModule } from '@nestjs/axios';
import { ForgeController } from './forge.controller.js';
import { ForgeService } from './forge.service.js';
import { ForgeApiService } from './forge-api.service.js';
import { PrismaModule } from '../prisma/prisma.module.js';

@Module({
  imports: [
    PrismaModule,
    HttpModule.register({
      timeout: 30000,
    }),
  ],

  controllers: [ForgeController],
  providers: [ForgeService, ForgeApiService],
})
export class ForgeModule {}

import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { PrismaModule } from '../prisma/prisma.module.js';

// Register scheduled services here when the external API contract is defined.
@Module({
  imports: [
    HttpModule.register({ timeout: 10000, maxRedirects: 3 }),
    PrismaModule,
  ],
})
export class ScheduledModule {}

import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { validateEnv } from './config/validate-env.js';
import { AuthModule } from './auth/auth.module.js';
import { HealthModule } from './health/health.module.js';
import { PrismaModule } from './prisma/prisma.module.js';
import { ScheduledModule } from './scheduled/scheduled.module.js';
import { OperatorsModule } from './operators/operators.module.js';
import { ResourcesModule } from './resources/resources.module.js';
import { SelectorsModule } from './selectors/selectors.module.js';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, validate: validateEnv }),
    ScheduleModule.forRoot(),
    PrismaModule,
    AuthModule,
    HealthModule,
    ScheduledModule,
    OperatorsModule,
    ResourcesModule,
    SelectorsModule,
  ],
  providers: [],
})
export class AppModule {}

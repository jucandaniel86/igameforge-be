import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module.js';
import { SelectorsController } from './selectors.controller.js';
import { SelectorsService } from './selectors.service.js';

@Module({
  controllers: [SelectorsController],
  providers: [SelectorsService],
  imports: [PrismaModule],
})
export class SelectorsModule {}

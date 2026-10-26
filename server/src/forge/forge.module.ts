import { Module } from '@nestjs/common';
import { ForgeService } from './forge.service.js';

@Module({
  providers: [ForgeService]
})
export class ForgeModule {}

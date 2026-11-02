import 'dotenv/config';
import 'reflect-metadata';
import { resolve } from 'node:path';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../dist/prisma/prisma.service.js';
import { ResourcesService } from '../dist/resources/resources.service.js';

const args = process.argv.slice(2);
if (args.some((arg) => !['--apply', '--overwrite'].includes(arg))) {
  throw new Error(
    'Usage: node scripts/import-game-templates.mjs [--apply] [--overwrite]',
  );
}
const prisma = new PrismaService(new ConfigService());
try {
  const report = await new ResourcesService(prisma).importGameTemplates(
    resolve('import-data/games.json'),
    {
      dryRun: !args.includes('--apply'),
      overwriteExisting: args.includes('--overwrite'),
    },
  );
  console.log(JSON.stringify(report, null, 2));
} finally {
  await prisma.$disconnect();
}

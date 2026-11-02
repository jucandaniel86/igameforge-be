import 'dotenv/config';
import { spawn } from 'node:child_process';
import { createWriteStream } from 'node:fs';
import { chmod, mkdir, mkdtemp, readFile, rm, stat, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { pipeline } from 'node:stream/promises';

const database = new URL(process.env.DATABASE_URL ?? '');
if (database.protocol !== 'mysql:') throw new Error('Expected a mysql DATABASE_URL');
const name = decodeURIComponent(database.pathname.slice(1));
if (!name || name.startsWith('-') || name.includes('/')) throw new Error('Invalid database name');
const quote = (value) => `"${value.replaceAll('\\', '\\\\').replaceAll('"', '\\"').replaceAll('\n', '\\n').replaceAll('\r', '\\r')}"`;
const directory = await mkdtemp(join(tmpdir(), 'igameforge-dump-'));
let output;
let completed = false;
try {
  const config = join(directory, 'client.cnf');
  await writeFile(config, [
    '[client]',
    `host=${quote(database.hostname)}`,
    `port=${database.port || '3306'}`,
    `user=${quote(decodeURIComponent(database.username))}`,
    `password=${quote(decodeURIComponent(database.password))}`,
    'protocol=tcp',
    '',
  ].join('\n'), { mode: 0o600 });
  const backups = resolve('backups');
  await mkdir(backups, { recursive: true, mode: 0o700 });
  await chmod(backups, 0o700);
  output = join(backups, `igameforge-${new Date().toISOString().replaceAll(':', '-')}.sql`);
  const child = spawn('mysqldump', [
    `--defaults-extra-file=${config}`, '--single-transaction', '--quick',
    '--hex-blob', '--routines', '--events', '--triggers', '--no-tablespaces',
    '--set-gtid-purged=OFF', '--default-character-set=utf8mb4', name,
  ], { stdio: ['ignore', 'pipe', 'pipe'] });
  let errors = '';
  child.stderr.on('data', (chunk) => { errors += chunk; });
  const exited = new Promise((accept, reject) => {
    child.on('error', reject);
    child.on('close', (code) => code === 0 ? accept() : reject(new Error(`mysqldump failed (${code}): ${errors}`)));
  });
  await Promise.all([
    exited,
    pipeline(child.stdout, createWriteStream(output, { flags: 'wx', mode: 0o600 })),
  ]);
  const size = (await stat(output)).size;
  // Confirm the tool finished its SQL output, without displaying database contents.
  const dump = await readFile(output, 'utf8');
  if (!size || !dump.includes('-- Dump completed on')) throw new Error('Dump completion marker missing');
  completed = true;
  console.log(JSON.stringify({ file: output, bytes: size, completed: true }, null, 2));
} finally {
  await rm(directory, { recursive: true, force: true });
  if (output && !completed) await rm(output, { force: true });
}

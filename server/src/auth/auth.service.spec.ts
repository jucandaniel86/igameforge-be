import 'reflect-metadata';
import { jest } from '@jest/globals';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Test } from '@nestjs/testing';
import type { INestApplication } from '@nestjs/common';
import request from 'supertest';
import * as bcrypt from 'bcrypt';
import { createHash } from 'node:crypto';
import { AuthService } from './auth.service.js';
import { AuthController } from './auth.controller.js';
import { AuthOriginGuard } from './guards/auth-origin.guard.js';
import { JwtStrategy } from './strategies/jwt.strategy.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { setupApp } from '../common/setup-app.js';
import { durationSeconds } from './auth.config.js';

const secret = 'access-test-secret-with-at-least-32-characters';
const refreshSecret = 'refresh-test-secret-with-at-least-32-characters';
const config = new ConfigService({
  JWT_SECRET: secret,
  JWT_REFRESH_SECRET: refreshSecret,
  JWT_REFRESH_EXPIRES_IN: '7d',
  CORS_ORIGINS: 'http://localhost:3000',
});
const jwt = new JwtService({
  secret,
  signOptions: { expiresIn: durationSeconds('30m') },
});
const user = {
  id: 1n,
  email: 'test@example.com',
  name: 'Test',
  env: 'dev',
  userType: 'admin',
  roles: [],
  password: bcrypt.hashSync('password', 4),
};
const sessions = new Map<string, any>();
const prisma = {
  user: {
    findUnique: jest.fn(async (query: any) => {
      if (query.where.id !== undefined && query.where.id !== user.id)
        return null;
      if (query.where.email !== undefined && query.where.email !== user.email)
        return null;
      if (!query.select) return user;
      return Object.fromEntries(
        Object.keys(query.select).map((key) => [
          key,
          user[key as keyof typeof user],
        ]),
      );
    }),
  },
  authSession: {
    create: jest.fn(async ({ data }: any) => {
      sessions.set(data.id, { ...data, revokedAt: null });
      return data;
    }),
    findUnique: jest.fn(async ({ where }: any) => {
      const value = sessions.get(where.id);
      return value ? { ...structuredClone(value), user } : null;
    }),
    updateMany: jest.fn(async ({ where, data }: any) => {
      const value = sessions.get(where.id);
      if (
        !value ||
        value.revokedAt ||
        (where.userId && value.userId !== where.userId) ||
        (where.tokenHash && value.tokenHash !== where.tokenHash) ||
        (where.expiresAt && value.expiresAt <= where.expiresAt.gt)
      )
        return { count: 0 };
      Object.assign(value, data);
      return { count: 1 };
    }),
  },
};
const service = new AuthService(
  prisma as unknown as PrismaService,
  jwt,
  config,
);
const login = () => service.login({ email: user.email, password: 'password' });

beforeEach(() => {
  sessions.clear();
  jest.clearAllMocks();
});

describe('Auth refresh sessions', () => {
  it('retains login credentials and signs 30-minute access / 7-day refresh tokens', async () => {
    const tokens = await login();
    const access = jwt.verify(tokens.access_token);
    const refresh = jwt.verify(tokens.refreshToken, { secret: refreshSecret });
    expect(access.exp - access.iat).toBe(1800);
    expect(refresh.exp - refresh.iat).toBeGreaterThanOrEqual(604798);
    expect(refresh.exp - refresh.iat).toBeLessThanOrEqual(604800);
    const session = [...sessions.values()][0];
    expect(session.tokenHash).toBe(
      createHash('sha256').update(tokens.refreshToken).digest('hex'),
    );
    expect(
      JSON.stringify(session, (_, v) =>
        typeof v === 'bigint' ? String(v) : v,
      ),
    ).not.toContain(tokens.refreshToken);
  });
  it('rejects invalid credentials without creating a session', async () => {
    await expect(
      service.login({ email: user.email, password: 'wrong' }),
    ).rejects.toMatchObject({ status: 401 });
    expect(sessions.size).toBe(0);
  });
  it('rotates refresh tokens and revokes a session when a consumed token is reused', async () => {
    const first = await login();
    const next = await service.refresh(first.refreshToken);
    expect(next.refreshToken).not.toBe(first.refreshToken);
    expect(jwt.verify(next.access_token).sub).toBe('1');
    expect(next.expiresAt).toEqual(first.expiresAt);
    await expect(service.refresh(first.refreshToken)).rejects.toMatchObject({
      status: 401,
    });
    await expect(service.refresh(next.refreshToken)).rejects.toMatchObject({
      status: 401,
    });
  });
  it('allows only one concurrent rotation and rejects replay', async () => {
    const first = await login();
    const results = await Promise.allSettled([
      service.refresh(first.refreshToken),
      service.refresh(first.refreshToken),
    ]);
    expect(
      results.filter((result) => result.status === 'fulfilled'),
    ).toHaveLength(1);
    expect(
      results.filter((result) => result.status === 'rejected'),
    ).toHaveLength(1);
    expect([...sessions.values()][0].revokedAt).toBeInstanceOf(Date);
  });
  it('rejects expired JWTs, expired sessions, invalid signatures and access tokens', async () => {
    const first = await login();
    const payload = jwt.decode(first.refreshToken);
    const expired = jwt.sign(
      { sub: '1', sid: payload.sid, jti: payload.jti, type: 'refresh' },
      { secret: refreshSecret, expiresIn: -1 },
    );
    await expect(service.refresh(expired)).rejects.toMatchObject({
      status: 401,
    });
    await expect(service.refresh(first.access_token)).rejects.toMatchObject({
      status: 401,
    });
    await expect(
      service.refresh(first.refreshToken + 'x'),
    ).rejects.toMatchObject({ status: 401 });
    sessions.get(payload.sid).expiresAt = new Date(0);
    await expect(service.refresh(first.refreshToken)).rejects.toMatchObject({
      status: 401,
    });
  });
  it('logs out idempotently and preserves other sessions and stateless access tokens', async () => {
    const first = await login();
    const second = await login();
    await service.logout(first.refreshToken);
    await service.logout(first.refreshToken);
    await service.logout(undefined);
    await expect(service.refresh(first.refreshToken)).rejects.toMatchObject({
      status: 401,
    });
    await expect(service.refresh(second.refreshToken)).resolves.toHaveProperty(
      'access_token',
    );
    expect(jwt.verify(first.access_token).sub).toBe('1');
  });
  it('can revoke using a correctly signed expired refresh JWT', async () => {
    const first = await login();
    const payload = jwt.decode(first.refreshToken);
    const expired = jwt.sign(
      { sub: '1', sid: payload.sid, jti: payload.jti, type: 'refresh' },
      { secret: refreshSecret, expiresIn: -1 },
    );
    await service.logout(expired);
    expect(sessions.get(payload.sid).revokedAt).toBeInstanceOf(Date);
  });
});

describe('Auth HTTP contract', () => {
  let app: INestApplication;
  beforeAll(async () => {
    const module = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        { provide: AuthService, useValue: service },
        { provide: ConfigService, useValue: config },
        AuthOriginGuard,
        JwtStrategy,
      ],
    }).compile();
    app = module.createNestApplication();
    setupApp(app);
    await app.init();
  });
  afterAll(async () => {
    await app?.close();
  });
  it('keeps the JSON envelope, hides refresh tokens, sets cookies and protects me', async () => {
    const response = await request(app.getHttpServer())
      .post('/api/auth/login')
      .set('X-Auth-Request', '1')
      .set('Origin', 'http://localhost:3000')
      .send({ email: user.email, password: 'password' })
      .expect(201);
    expect(Object.keys(response.body.data)).toEqual(['access_token']);
    const cookie = response.headers['set-cookie'][0];
    expect(cookie).toContain('HttpOnly');
    expect(cookie).toContain('Path=/api/auth');
    expect(cookie).toContain('SameSite=Lax');
    expect(cookie).toContain('Expires=');
    await request(app.getHttpServer()).get('/api/auth/me').expect(401);
    const me = await request(app.getHttpServer())
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${response.body.data.access_token}`)
      .expect(200);
    expect(me.body.data.user.password).toBeUndefined();
    const refreshed = await request(app.getHttpServer())
      .post('/api/auth/refresh')
      .set('X-Auth-Request', '1')
      .set('Cookie', cookie.split(';')[0])
      .expect(200);
    expect(refreshed.headers['set-cookie'][0]).not.toEqual(cookie);
    const newCookie = refreshed.headers['set-cookie'][0].split(';')[0];
    const logout = await request(app.getHttpServer())
      .post('/api/auth/logout')
      .set('X-Auth-Request', '1')
      .set('Cookie', newCookie)
      .expect(200);
    expect(logout.headers['set-cookie'][0]).toContain(
      'Expires=Thu, 01 Jan 1970',
    );
    await request(app.getHttpServer())
      .post('/api/auth/refresh')
      .set('X-Auth-Request', '1')
      .set('Cookie', newCookie)
      .expect(401);
    await request(app.getHttpServer())
      .post('/api/auth/logout')
      .set('X-Auth-Request', '1')
      .expect(200);
  });
  it('rejects missing CSRF headers and untrusted origins', async () => {
    await request(app.getHttpServer()).post('/api/auth/refresh').expect(403);
    await request(app.getHttpServer())
      .post('/api/auth/refresh')
      .set('X-Auth-Request', '1')
      .set('Origin', 'https://attacker.example')
      .expect(403);
  });
});

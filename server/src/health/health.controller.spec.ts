import { Test } from '@nestjs/testing';
import { HealthController } from './health.controller.js';

describe('HealthController', () => {
  it('returns a success response', async () => {
    const module = await Test.createTestingModule({
      controllers: [HealthController],
    }).compile();
    expect(module.get(HealthController).getHealth()).toEqual({ status: 'ok' });
    await module.close();
  });
});

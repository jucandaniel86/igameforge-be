import { Test, TestingModule } from '@nestjs/testing';
import { ForgeController } from './forge.controller.js';

describe('ForgeController', () => {
  let controller: ForgeController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ForgeController],
    }).compile();

    controller = module.get<ForgeController>(ForgeController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});

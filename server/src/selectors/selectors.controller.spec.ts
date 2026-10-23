import { Test, TestingModule } from '@nestjs/testing';
import { SelectorsController } from './selectors.controller.js';

describe('SelectorsController', () => {
  let controller: SelectorsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [SelectorsController],
    }).compile();

    controller = module.get<SelectorsController>(SelectorsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});

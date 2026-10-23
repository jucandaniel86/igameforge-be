import { Test, TestingModule } from '@nestjs/testing';
import { SelectorsService } from './selectors.service.js';

describe('SelectorsService', () => {
  let service: SelectorsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [SelectorsService],
    }).compile();

    service = module.get<SelectorsService>(SelectorsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});

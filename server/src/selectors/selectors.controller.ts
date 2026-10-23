import { Controller, Get } from '@nestjs/common';
import { SelectorsService } from './selectors.service.js';

@Controller('selectors')
export class SelectorsController {
  constructor(private readonly selectorService: SelectorsService) {}

  @Get('/environments')
  getEnvironments() {
    return this.selectorService.getEnvironments();
  }
}

import { Controller, Get } from '@nestjs/common';
import { ApiOkResponse, ApiTags } from '@nestjs/swagger';

@ApiTags('health')
@Controller('health')
export class HealthController {
  @Get()
  @ApiOkResponse({ description: 'Application is running (liveness only).' })
  getHealth(): { status: string } {
    return { status: 'ok' };
  }
}

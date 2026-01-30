import { Controller, Get } from '@nestjs/common';

type HealthResponse = {
  status: 'ok';
  time: string;
};

@Controller('v1/health')
export class HealthController {
  @Get()
  health(): HealthResponse {
    return { status: 'ok', time: new Date().toISOString() };
  }
}

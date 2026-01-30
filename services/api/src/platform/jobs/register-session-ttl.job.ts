import { Injectable } from '@nestjs/common';
import { ConfigService } from '../config/config.service';
import { RegisterSessionsService } from '../../domains/register-sessions/register-sessions.service';

@Injectable()
export class RegisterSessionTtlJob {
  constructor(
    private readonly configService: ConfigService,
    private readonly registerSessionsService: RegisterSessionsService
  ) {}

  async runOnce(): Promise<void> {
    void this.configService;
    void this.registerSessionsService;
    throw new Error('Not implemented');
  }
}

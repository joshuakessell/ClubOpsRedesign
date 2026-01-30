import { Module } from '@nestjs/common';
import { ConfigModule } from '../config/config.module';
import { RegisterSessionsModule } from '../../domains/register-sessions/register-sessions.module';
import { RegisterSessionTtlJob } from './register-session-ttl.job';

@Module({
  imports: [ConfigModule, RegisterSessionsModule],
  providers: [RegisterSessionTtlJob],
  exports: [RegisterSessionTtlJob],
})
export class JobsModule {}

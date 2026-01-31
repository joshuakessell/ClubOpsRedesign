import { Inject, Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { RegisterSessionTtlJob } from './register-session-ttl.job';

@Injectable()
export class JobsRunner implements OnModuleInit, OnModuleDestroy {
  private timer: NodeJS.Timeout | null = null;
  private isRunning = false;
  private readonly logger = new Logger(JobsRunner.name);

  constructor(
    @Inject(RegisterSessionTtlJob) private readonly registerSessionTtlJob: RegisterSessionTtlJob
  ) {}

  onModuleInit() {
    void this.runRegisterSessionTtl();

    const intervalSeconds = this.registerSessionTtlJob.getIntervalSeconds();
    if (intervalSeconds <= 0) return;

    this.timer = setInterval(() => {
      void this.runRegisterSessionTtl();
    }, intervalSeconds * 1000);
    this.timer.unref?.();
  }

  onModuleDestroy() {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }

  private async runRegisterSessionTtl(): Promise<void> {
    if (this.isRunning) return;
    this.isRunning = true;
    try {
      await this.registerSessionTtlJob.runOnce();
    } catch (error) {
      // Keep runner alive on errors.
      this.logger.error(
        'RegisterSession TTL job failed',
        error instanceof Error ? error.stack : String(error)
      );
    } finally {
      this.isRunning = false;
    }
  }
}

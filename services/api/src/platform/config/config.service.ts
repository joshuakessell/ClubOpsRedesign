import { Injectable } from '@nestjs/common';

@Injectable()
export class ConfigService {
  get(key: string, fallback?: string): string | undefined {
    return process.env[key] ?? fallback;
  }

  getNumber(key: string, fallback: number): number {
    const raw = process.env[key];
    if (!raw) return fallback;
    const parsed = Number(raw);
    return Number.isFinite(parsed) ? parsed : fallback;
  }

  getRegisterSessionTtlSeconds(): number {
    return this.getNumber('REGISTER_SESSION_TTL_SECONDS', 900);
  }

  getRegisterSessionCleanupIntervalSeconds(): number {
    return this.getNumber('REGISTER_SESSION_CLEANUP_INTERVAL_SECONDS', 30);
  }

  getStaffSessionTtlSeconds(): number {
    return this.getNumber('STAFF_SESSION_TTL_SECONDS', 43200);
  }
}

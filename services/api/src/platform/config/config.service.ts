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
}

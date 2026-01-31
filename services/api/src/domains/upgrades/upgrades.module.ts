import { Module } from '@nestjs/common';
import { DatabaseModule } from '../../platform/database/database.module';
import { AuditModule } from '../audit/audit.module';
import { UpgradesRepository } from './upgrades.repository';
import { UpgradesService } from './upgrades.service';

@Module({
  imports: [DatabaseModule, AuditModule],
  providers: [UpgradesRepository, UpgradesService],
  exports: [UpgradesService],
})
export class UpgradesModule {}

import { Module } from '@nestjs/common';
import { DatabaseModule } from '../../platform/database/database.module';
import { AuditModule } from '../audit/audit.module';
import { HoldsRepository } from './holds.repository';
import { HoldsService } from './holds.service';

@Module({
  imports: [DatabaseModule, AuditModule],
  providers: [HoldsRepository, HoldsService],
  exports: [HoldsService],
})
export class HoldsModule {}

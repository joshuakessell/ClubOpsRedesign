import { Module } from '@nestjs/common';
import { DatabaseModule } from '../../platform/database/database.module';
import { AuditRepository } from './audit.repository';
import { AuditService } from './audit.service';
import { AuditReadRepository } from './audit-read.repository';
import { AuditReadService } from './audit-read.service';

@Module({
  imports: [DatabaseModule],
  providers: [AuditRepository, AuditService, AuditReadRepository, AuditReadService],
  exports: [AuditService, AuditReadService],
})
export class AuditModule {}

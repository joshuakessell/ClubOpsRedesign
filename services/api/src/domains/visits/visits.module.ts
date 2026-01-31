import { Module } from '@nestjs/common';
import { DatabaseModule } from '../../platform/database/database.module';
import { AuditModule } from '../audit/audit.module';
import { CustomersModule } from '../customers/customers.module';
import { VisitsRepository } from './visits.repository';
import { VisitRenewalsRepository } from './visit-renewals.repository';
import { VisitsReadService } from './visits.read.service';
import { VisitsService } from './visits.service';

@Module({
  imports: [DatabaseModule, AuditModule, CustomersModule],
  providers: [
    VisitsRepository,
    VisitRenewalsRepository,
    VisitsReadService,
    VisitsService,
  ],
  exports: [VisitsReadService, VisitsService],
})
export class VisitsModule {}

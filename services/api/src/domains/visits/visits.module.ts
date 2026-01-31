import { Module } from '@nestjs/common';
import { DatabaseModule } from '../../platform/database/database.module';
import { AuditModule } from '../audit/audit.module';
import { CustomersModule } from '../customers/customers.module';
import { InventoryModule } from '../inventory/inventory.module';
import { AssignmentsModule } from '../assignments/assignments.module';
import { VisitsRepository } from './visits.repository';
import { VisitRenewalsRepository } from './visit-renewals.repository';
import { VisitsReadService } from './visits.read.service';
import { VisitsService } from './visits.service';
import { VisitOrchestratorService } from './visit-orchestrator.service';
import { VisitsController } from './visits.controller';

@Module({
  imports: [DatabaseModule, AuditModule, CustomersModule, InventoryModule, AssignmentsModule],
  controllers: [VisitsController],
  providers: [
    VisitsRepository,
    VisitRenewalsRepository,
    VisitsReadService,
    VisitsService,
    VisitOrchestratorService,
  ],
  exports: [VisitsReadService, VisitsService],
})
export class VisitsModule {}

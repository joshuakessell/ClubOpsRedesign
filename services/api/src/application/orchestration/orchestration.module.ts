import { Module } from '@nestjs/common';
import { AssignmentsModule } from '../../domains/assignments/assignments.module';
import { AuditModule } from '../../domains/audit/audit.module';
import { CheckoutController } from '../../domains/checkout/checkout.controller';
import { CheckoutModule } from '../../domains/checkout/checkout.module';
import { CleaningController } from '../../domains/cleaning/cleaning.controller';
import { CleaningModule } from '../../domains/cleaning/cleaning.module';
import { HoldsController } from '../../domains/holds/holds.controller';
import { HoldsModule } from '../../domains/holds/holds.module';
import { InventoryModule } from '../../domains/inventory/inventory.module';
import { KeysModule } from '../../domains/keys/keys.module';
import { UpgradesController } from '../../domains/upgrades/upgrades.controller';
import { UpgradesModule } from '../../domains/upgrades/upgrades.module';
import { VisitsController } from '../../domains/visits/visits.controller';
import { VisitsModule } from '../../domains/visits/visits.module';
import { WaitlistModule } from '../../domains/waitlist/waitlist.module';
import { DatabaseModule } from '../../platform/database/database.module';
import { CheckoutOrchestratorService } from './checkout-orchestrator.service';
import { CleaningOrchestratorService } from './cleaning-orchestrator.service';
import { HoldsOrchestratorService } from './holds-orchestrator.service';
import { UpgradesOrchestratorService } from './upgrades-orchestrator.service';
import { VisitLifecycleService } from './visit-lifecycle.service';

@Module({
  imports: [
    AuditModule,
    AssignmentsModule,
    CheckoutModule,
    CleaningModule,
    HoldsModule,
    InventoryModule,
    KeysModule,
    UpgradesModule,
    VisitsModule,
    WaitlistModule,
    DatabaseModule,
  ],
  controllers: [
    CleaningController,
    HoldsController,
    UpgradesController,
    CheckoutController,
    VisitsController,
  ],
  providers: [
    CleaningOrchestratorService,
    HoldsOrchestratorService,
    UpgradesOrchestratorService,
    CheckoutOrchestratorService,
    VisitLifecycleService,
  ],
})
export class OrchestrationModule {}

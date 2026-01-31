import { Module } from '@nestjs/common';
import { DatabaseModule } from '../../platform/database/database.module';
import { AuditModule } from '../audit/audit.module';
import { HoldsModule } from '../holds/holds.module';
import { AssignmentsModule } from '../assignments/assignments.module';
import { InventoryModule } from '../inventory/inventory.module';
import { VisitsModule } from '../visits/visits.module';
import { UpgradesRepository } from './upgrades.repository';
import { UpgradesService } from './upgrades.service';
import { UpgradesController } from './upgrades.controller';

@Module({
  imports: [DatabaseModule, AuditModule, HoldsModule, AssignmentsModule, InventoryModule, VisitsModule],
  controllers: [UpgradesController],
  providers: [UpgradesRepository, UpgradesService],
})
export class UpgradesModule {}

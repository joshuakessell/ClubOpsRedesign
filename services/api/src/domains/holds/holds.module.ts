import { Module } from '@nestjs/common';
import { DatabaseModule } from '../../platform/database/database.module';
import { AuditModule } from '../audit/audit.module';
import { InventoryModule } from '../inventory/inventory.module';
import { AssignmentsModule } from '../assignments/assignments.module';
import { VisitsModule } from '../visits/visits.module';
import { WaitlistModule } from '../waitlist/waitlist.module';
import { HoldsRepository } from './holds.repository';
import { HoldsService } from './holds.service';
import { HoldsController } from './holds.controller';

@Module({
  imports: [DatabaseModule, AuditModule, InventoryModule, AssignmentsModule, VisitsModule, WaitlistModule],
  controllers: [HoldsController],
  providers: [HoldsRepository, HoldsService],
  exports: [HoldsService],
})
export class HoldsModule {}

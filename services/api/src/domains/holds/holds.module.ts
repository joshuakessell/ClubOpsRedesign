import { Module } from '@nestjs/common';
import { DatabaseModule } from '../../platform/database/database.module';
import { AuditModule } from '../audit/audit.module';
import { InventoryModule } from '../inventory/inventory.module';
import { AssignmentsModule } from '../assignments/assignments.module';
import { HoldsRepository } from './holds.repository';
import { HoldsService } from './holds.service';
import { HoldsController } from './holds.controller';

@Module({
  imports: [DatabaseModule, AuditModule, InventoryModule, AssignmentsModule],
  controllers: [HoldsController],
  providers: [HoldsRepository, HoldsService],
  exports: [HoldsService],
})
export class HoldsModule {}

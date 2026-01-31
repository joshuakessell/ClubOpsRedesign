import { Module } from '@nestjs/common';
import { DatabaseModule } from '../../platform/database/database.module';
import { AuditModule } from '../audit/audit.module';
import { InventoryModule } from '../inventory/inventory.module';
import { AssignmentsModule } from '../assignments/assignments.module';
import { VisitsModule } from '../visits/visits.module';
import { CheckoutRepository } from './checkout.repository';
import { CheckoutService } from './checkout.service';
import { CheckoutController } from './checkout.controller';

@Module({
  imports: [DatabaseModule, AuditModule, InventoryModule, AssignmentsModule, VisitsModule],
  controllers: [CheckoutController],
  providers: [CheckoutRepository, CheckoutService],
})
export class CheckoutModule {}

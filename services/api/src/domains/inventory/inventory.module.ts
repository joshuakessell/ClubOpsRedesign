import { Module } from '@nestjs/common';
import { DatabaseModule } from '../../platform/database/database.module';
import { AuditModule } from '../audit/audit.module';
import { InventoryRepository } from './inventory.repository';
import { InventoryReadService } from './inventory.read.service';
import { InventoryService } from './inventory.service';
import { InventoryController } from './inventory.controller';
import { InventoryAdminController } from './inventory-admin.controller';

@Module({
  imports: [DatabaseModule, AuditModule],
  controllers: [InventoryController, InventoryAdminController],
  providers: [InventoryRepository, InventoryReadService, InventoryService],
  exports: [InventoryReadService, InventoryService],
})
export class InventoryModule {}

import { Module } from '@nestjs/common';
import { DatabaseModule } from '../../platform/database/database.module';
import { AuditModule } from '../audit/audit.module';
import { InventoryModule } from '../inventory/inventory.module';
import { KeysRepository } from './keys.repository';
import { KeysReadService } from './keys.read.service';
import { KeysService } from './keys.service';
import { KeysController } from './keys.controller';
import { KeysAdminController } from './keys-admin.controller';

@Module({
  imports: [DatabaseModule, AuditModule, InventoryModule],
  controllers: [KeysController, KeysAdminController],
  providers: [KeysRepository, KeysReadService, KeysService],
  exports: [KeysReadService, KeysService],
})
export class KeysModule {}

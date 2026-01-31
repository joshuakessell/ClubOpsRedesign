import { Module } from '@nestjs/common';
import { DatabaseModule } from '../../platform/database/database.module';
import { CleaningRepository } from './cleaning.repository';
import { CleaningService } from './cleaning.service';
import { CleaningController } from './cleaning.controller';
import { CleaningReadService } from './cleaning.read.service';
import { InventoryModule } from '../inventory/inventory.module';
import { KeysModule } from '../keys/keys.module';

@Module({
  imports: [DatabaseModule, InventoryModule, KeysModule],
  controllers: [CleaningController],
  providers: [CleaningRepository, CleaningService, CleaningReadService],
  exports: [CleaningReadService],
})
export class CleaningModule {}

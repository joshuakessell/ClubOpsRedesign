import { Module } from '@nestjs/common';
import { DatabaseModule } from '../../platform/database/database.module';
import { CleaningRepository } from './cleaning.repository';
import { CleaningService } from './cleaning.service';
import { CleaningReadService } from './cleaning.read.service';

@Module({
  imports: [DatabaseModule],
  providers: [CleaningRepository, CleaningService, CleaningReadService],
  exports: [CleaningReadService, CleaningService],
})
export class CleaningModule {}

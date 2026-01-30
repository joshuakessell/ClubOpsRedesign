import { Module } from '@nestjs/common';
import { DatabaseModule } from '../../platform/database/database.module';
import { StaffRepository } from './staff.repository';
import { StaffReadService } from './staff.read.service';

@Module({
  imports: [DatabaseModule],
  providers: [StaffRepository, StaffReadService],
  exports: [StaffReadService],
})
export class StaffModule {}

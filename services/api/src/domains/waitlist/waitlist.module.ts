import { Module } from '@nestjs/common';
import { DatabaseModule } from '../../platform/database/database.module';
import { AuditModule } from '../audit/audit.module';
import { CustomersModule } from '../customers/customers.module';
import { WaitlistRepository } from './waitlist.repository';
import { WaitlistReadService } from './waitlist.read.service';
import { WaitlistService } from './waitlist.service';
import { WaitlistController } from './waitlist.controller';

@Module({
  imports: [DatabaseModule, AuditModule, CustomersModule],
  controllers: [WaitlistController],
  providers: [WaitlistRepository, WaitlistReadService, WaitlistService],
  exports: [WaitlistReadService, WaitlistService],
})
export class WaitlistModule {}

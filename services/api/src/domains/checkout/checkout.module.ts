import { Module } from '@nestjs/common';
import { DatabaseModule } from '../../platform/database/database.module';
import { AuditModule } from '../audit/audit.module';
import { CheckoutRepository } from './checkout.repository';
import { CheckoutService } from './checkout.service';

@Module({
  imports: [DatabaseModule, AuditModule],
  providers: [CheckoutRepository, CheckoutService],
  exports: [CheckoutService],
})
export class CheckoutModule {}

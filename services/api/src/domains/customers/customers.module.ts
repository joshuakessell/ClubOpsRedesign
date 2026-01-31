import { Module } from '@nestjs/common';
import { DatabaseModule } from '../../platform/database/database.module';
import { AuditModule } from '../audit/audit.module';
import { CustomersRepository } from './customers.repository';
import { CustomersReadService } from './customers.read.service';
import { CustomersService } from './customers.service';
import { CustomersController } from './customers.controller';

@Module({
  imports: [DatabaseModule, AuditModule],
  controllers: [CustomersController],
  providers: [CustomersRepository, CustomersReadService, CustomersService],
  exports: [CustomersReadService],
})
export class CustomersModule {}

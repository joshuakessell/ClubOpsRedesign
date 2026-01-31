import { Module } from '@nestjs/common';
import { DatabaseModule } from '../../platform/database/database.module';
import { AuditModule } from '../audit/audit.module';
import { VisitsModule } from '../visits/visits.module';
import { AgreementsRepository } from './agreements.repository';
import { AgreementsService } from './agreements.service';
import { AgreementsController } from './agreements.controller';

@Module({
  imports: [DatabaseModule, AuditModule, VisitsModule],
  controllers: [AgreementsController],
  providers: [AgreementsRepository, AgreementsService],
})
export class AgreementsModule {}

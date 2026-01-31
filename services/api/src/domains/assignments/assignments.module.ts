import { Module } from '@nestjs/common';
import { AssignmentsRepository } from './assignments.repository';
import { AssignmentsService } from './assignments.service';

@Module({
  providers: [AssignmentsRepository, AssignmentsService],
  exports: [AssignmentsService],
})
export class AssignmentsModule {}

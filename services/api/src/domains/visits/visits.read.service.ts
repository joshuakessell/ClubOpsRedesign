import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../../platform/database/database.service';
import { VisitsRepository } from './visits.repository';
import type { VisitDto } from './dto/visit.dto';
import type { Selectable } from 'kysely';
import type { Database } from '../../platform/database/database.types';

@Injectable()
export class VisitsReadService {
  constructor(
    private readonly databaseService: DatabaseService,
    private readonly visitsRepository: VisitsRepository
  ) {}

  async findById(id: string) {
    return this.visitsRepository.findById(this.databaseService.client, id);
  }

  async findDtoById(id: string): Promise<VisitDto | null> {
    const visit = await this.findById(id);
    return visit ? this.toDto(visit) : null;
  }

  async findActiveByCustomerId(customerId: string): Promise<VisitDto | null> {
    const visit = await this.visitsRepository.findActiveByCustomerId(
      this.databaseService.client,
      customerId
    );
    return visit ? this.toDto(visit) : null;
  }

  toDto(visit: Selectable<Database['visits']>): VisitDto {
    return {
      id: visit.id,
      customerId: visit.customer_id,
      status: visit.status,
      startedAt: visit.started_at.toISOString(),
      plannedEndAt: visit.planned_end_at.toISOString(),
      closedAt: visit.closed_at ? visit.closed_at.toISOString() : null,
      initialDurationMinutes: visit.initial_duration_minutes,
      maxTotalDurationMinutes: visit.max_total_duration_minutes,
      renewalTotalMinutes: visit.renewal_total_minutes,
    };
  }
}

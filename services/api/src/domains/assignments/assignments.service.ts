import { Injectable } from '@nestjs/common';
import type { Kysely, Selectable } from 'kysely';
import type { Database } from '../../platform/database/database.types';
import { AssignmentsRepository } from './assignments.repository';
import type { VisitAssignmentDto } from './dto/assignment.dto';

@Injectable()
export class AssignmentsService {
  constructor(private readonly assignmentsRepository: AssignmentsRepository) {}

  async create(
    db: Kysely<Database>,
    visitId: string,
    inventoryItemId: string
  ): Promise<Selectable<Database['visit_assignments']>> {
    return this.assignmentsRepository.create(db, {
      visit_id: visitId,
      inventory_item_id: inventoryItemId,
      assigned_at: new Date(),
      released_at: null,
    });
  }

  async releaseByVisit(
    db: Kysely<Database>,
    visitId: string
  ): Promise<Selectable<Database['visit_assignments']> | undefined> {
    return this.assignmentsRepository.releaseByVisit(db, visitId);
  }

  async findActiveByVisit(db: Kysely<Database>, visitId: string) {
    return this.assignmentsRepository.findActiveByVisit(db, visitId);
  }

  async findActiveByInventoryItem(db: Kysely<Database>, inventoryItemId: string) {
    return this.assignmentsRepository.findActiveByInventoryItem(db, inventoryItemId);
  }

  async releaseByVisitIdempotent(db: Kysely<Database>, visitId: string) {
    return this.assignmentsRepository.releaseByVisit(db, visitId);
  }

  async reassign(db: Kysely<Database>, visitId: string, inventoryItemId: string) {
    return this.assignmentsRepository.reassign(db, visitId, inventoryItemId);
  }

  toDto(assignment: Selectable<Database['visit_assignments']>): VisitAssignmentDto {
    return {
      visitId: assignment.visit_id,
      inventoryItemId: assignment.inventory_item_id,
      assignedAt: assignment.assigned_at.toISOString(),
      releasedAt: assignment.released_at ? assignment.released_at.toISOString() : null,
    };
  }
}

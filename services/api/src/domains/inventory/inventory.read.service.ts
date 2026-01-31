import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../../platform/database/database.service';
import { InventoryRepository } from './inventory.repository';
import type { InventoryItemDto, InventoryItemType, InventoryStatus } from './dto/inventory.dto';
import type { Selectable } from 'kysely';
import type { Database } from '../../platform/database/database.types';

@Injectable()
export class InventoryReadService {
  constructor(
    private readonly databaseService: DatabaseService,
    private readonly inventoryRepository: InventoryRepository
  ) {}

  async list(filters: { type?: InventoryItemType; status?: InventoryStatus }): Promise<InventoryItemDto[]> {
    const items = await this.inventoryRepository.list(this.databaseService.client, filters);
    return items.map((item) => this.toDto(item));
  }

  async findById(id: string) {
    return this.inventoryRepository.findById(this.databaseService.client, id);
  }

  async findDtoById(id: string): Promise<InventoryItemDto | null> {
    const item = await this.findById(id);
    return item ? this.toDto(item) : null;
  }

  private toDto(item: Selectable<Database['inventory_items']>): InventoryItemDto {
    return {
      id: item.id,
      type: item.type,
      name: item.name,
      status: item.status,
      notes: item.notes ?? null,
      updatedAt: item.updated_at.toISOString(),
    };
  }
}

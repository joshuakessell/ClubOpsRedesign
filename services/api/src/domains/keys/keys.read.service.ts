import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../../platform/database/database.service';
import { KeysRepository } from './keys.repository';
import type { KeyTagDto } from './dto/key-tag.dto';

@Injectable()
export class KeysReadService {
  constructor(
    private readonly databaseService: DatabaseService,
    private readonly keysRepository: KeysRepository
  ) {}

  async findByTagCode(tagCode: string) {
    return this.keysRepository.findByTagCode(this.databaseService.client, tagCode);
  }

  async findById(id: string) {
    return this.keysRepository.findById(this.databaseService.client, id);
  }

  async findDtoById(id: string): Promise<KeyTagDto | null> {
    const tag = await this.findById(id);
    return tag ? this.toDto(tag) : null;
  }

  toDto(tag: {
    id: string;
    tag_code: string;
    assigned_to_item_id: string | null;
    enabled: boolean;
  }): KeyTagDto {
    return {
      id: tag.id,
      tagCode: tag.tag_code,
      assignedToItemId: tag.assigned_to_item_id ?? null,
      enabled: tag.enabled,
    };
  }
}

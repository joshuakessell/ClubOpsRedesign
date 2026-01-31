import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../../platform/database/database.service';
import { CustomersRepository } from './customers.repository';
import type { CustomerDto } from './dto/customer.dto';
import type { Selectable } from 'kysely';
import type { Database } from '../../platform/database/database.types';

@Injectable()
export class CustomersReadService {
  constructor(
    private readonly databaseService: DatabaseService,
    private readonly customersRepository: CustomersRepository
  ) {}

  async findById(id: string) {
    return this.customersRepository.findById(this.databaseService.client, id);
  }

  async findDtoById(id: string): Promise<CustomerDto | null> {
    const customer = await this.findById(id);
    return customer ? this.toDto(customer) : null;
  }

  async search(query: string, limit: number): Promise<CustomerDto[]> {
    const rows = await this.customersRepository.search(this.databaseService.client, query, limit);
    return rows.map((row) => this.toDto(row));
  }

  private toDto(customer: Selectable<Database['customers']>): CustomerDto {
    return {
      id: customer.id,
      firstName: customer.first_name,
      lastName: customer.last_name,
      displayName: customer.display_name ?? null,
      phone: customer.phone ?? null,
      email: customer.email ?? null,
      createdAt: customer.created_at.toISOString(),
    };
  }
}

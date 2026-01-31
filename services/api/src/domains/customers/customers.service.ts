import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../../platform/database/database.service';
import { AuditService } from '../audit/audit.service';
import { CustomersRepository } from './customers.repository';
import type { CreateCustomerRequestDto } from './dto/customer-requests.dto';
import type { CustomerDto } from './dto/customer.dto';
import { throwValidation } from '../../platform/http/errors';
import type { Selectable } from 'kysely';
import type { Database } from '../../platform/database/database.types';

@Injectable()
export class CustomersService {
  constructor(
    private readonly databaseService: DatabaseService,
    private readonly customersRepository: CustomersRepository,
    private readonly auditService: AuditService
  ) {}

  async create(request: CreateCustomerRequestDto, actorStaffId: string | null): Promise<CustomerDto> {
    if (!request.firstName || !request.lastName) {
      throwValidation('firstName and lastName are required');
    }

    const created = await this.databaseService.transaction(async (trx) => {
      const customer = await this.customersRepository.create(trx, {
        first_name: request.firstName,
        last_name: request.lastName,
        display_name: request.displayName ?? null,
        phone: request.phone ?? null,
        email: request.email ?? null,
        created_at: new Date(),
      });

      await this.auditService.write(
        {
          action: 'CUSTOMER_CREATED',
          entityType: 'customer',
          entityId: customer.id,
          actorStaffId,
          metadata: {
            firstName: customer.first_name,
            lastName: customer.last_name,
          },
        },
        trx
      );

      return customer;
    });

    return this.toDto(created);
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

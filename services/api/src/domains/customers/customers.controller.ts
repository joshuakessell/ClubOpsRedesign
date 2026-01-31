import { Body, Controller, Get, Post, Query, Req, UseGuards } from '@nestjs/common';
import { DeviceAuthGuard } from '../../platform/auth-device/device-auth.guard';
import { StaffAuthGuard } from '../auth-staff/guards/staff-auth.guard';
import { CustomersReadService } from './customers.read.service';
import { CustomersService } from './customers.service';
import type { CreateCustomerRequestDto } from './dto/customer-requests.dto';
import type { CustomerDto, CustomerListResponseDto } from './dto/customer.dto';
import type { Request } from 'express';
import type { RequestContext } from '../../platform/http/request-context';
import { throwUnauthorized, throwValidation } from '../../platform/http/errors';

@Controller('v1/customers')
export class CustomersController {
  constructor(
    private readonly customersReadService: CustomersReadService,
    private readonly customersService: CustomersService
  ) {}

  @Get()
  @UseGuards(DeviceAuthGuard, StaffAuthGuard)
  async search(@Query('query') query?: string): Promise<CustomerListResponseDto> {
    if (!query || query.trim().length === 0) {
      throwValidation('query is required');
    }
    const items = await this.customersReadService.search(query.trim(), 50);
    return { items };
  }

  @Post()
  @UseGuards(DeviceAuthGuard, StaffAuthGuard)
  async create(
    @Body() body: CreateCustomerRequestDto,
    @Req() req: Request & RequestContext
  ): Promise<CustomerDto> {
    if (!req.staffSession) {
      throwUnauthorized('Staff session context missing', 'STAFF_UNAUTHORIZED');
    }
    return this.customersService.create(body, req.staffSession.staffId);
  }
}

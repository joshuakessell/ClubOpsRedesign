import { Injectable } from '@nestjs/common';
import type { DomainEventsPublisher, RegisterSessionUpdatedEvent } from './domain-events.publisher';

@Injectable()
export class NoopDomainEventsPublisher implements DomainEventsPublisher {
  async publishRegisterSessionUpdated(_event: RegisterSessionUpdatedEvent): Promise<void> {
    return;
  }
}

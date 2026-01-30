import { Module } from '@nestjs/common';
import { NoopDomainEventsPublisher } from './noop-domain-events.publisher';

export const DOMAIN_EVENTS_PUBLISHER = 'DOMAIN_EVENTS_PUBLISHER';

@Module({
  providers: [
    NoopDomainEventsPublisher,
    {
      provide: DOMAIN_EVENTS_PUBLISHER,
      useExisting: NoopDomainEventsPublisher,
    },
  ],
  exports: [DOMAIN_EVENTS_PUBLISHER, NoopDomainEventsPublisher],
})
export class EventsModule {}

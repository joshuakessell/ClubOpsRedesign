import { Module } from '@nestjs/common';
import { DatabaseService } from './database.service';

export const KYSELY_PROVIDER = 'KYSELY_PROVIDER';

@Module({
  providers: [
    DatabaseService,
    {
      provide: KYSELY_PROVIDER,
      useFactory: () => {
        throw new Error('Kysely provider not configured');
      },
    },
  ],
  exports: [DatabaseService, KYSELY_PROVIDER],
})
export class DatabaseModule {}

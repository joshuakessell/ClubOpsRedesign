import { Module } from '@nestjs/common';
import { Kysely, PostgresDialect } from 'kysely';
import { Pool } from 'pg';
import { DatabaseService } from './database.service';
import { ConfigModule } from '../config/config.module';
import { ConfigService } from '../config/config.service';
import type { Database } from './database.types';
import { KYSELY_PROVIDER } from './database.constants';

@Module({
  imports: [ConfigModule],
  providers: [
    DatabaseService,
    {
      provide: KYSELY_PROVIDER,
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const host = configService.get('DB_HOST', 'localhost');
        const port = configService.getNumber('DB_PORT', 5432);
        const database = configService.get('DB_NAME', 'clubops');
        const user = configService.get('DB_USER', 'clubops');
        const password = configService.get('DB_PASSWORD', 'clubops_dev');
        const pool = new Pool({ host, port, database, user, password });
        return new Kysely<Database>({
          dialect: new PostgresDialect({ pool }),
        });
      },
    },
  ],
  exports: [DatabaseService, KYSELY_PROVIDER],
})
export class DatabaseModule {}

import { Inject, Injectable } from '@nestjs/common';
import { count } from 'drizzle-orm';
import { DRIZZLE, type DrizzleDB } from './db/db.module.js';
import { athletes } from './db/schema.js';

@Injectable()
export class AppService {
    constructor(@Inject(DRIZZLE) private readonly db: DrizzleDB) {}
   async getHello(): Promise<string> {
    const [{ total }] = await this.db.select({ total: count() }).from(athletes);
    return `Connected to PostgreSQL. Athletes in database: ${total}`;
  }
}

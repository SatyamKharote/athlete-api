import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { and, count, desc, eq, gte, lte, type SQL } from 'drizzle-orm';
import { DRIZZLE, type DrizzleDB } from '../db/db.module.js';
import { athletes, trainingSessions } from '../db/schema.js';
import { CreateSessionDto } from './dto/create-session.dto.js';
import { UpdateSessionDto } from './dto/update-session.dto.js';
import { ListSessionsQueryDto } from './dto/list-sessions-query.dto.js';

type Session = typeof trainingSessions.$inferSelect;

function withLoad(session: Session) {
  return { ...session, trainingLoad: session.durationMin * session.rpe };
}

@Injectable()
export class SessionsService {
  constructor(@Inject(DRIZZLE) private readonly db: DrizzleDB) {}

  private async ensureAthleteExists(athleteId: string) {
    const [athlete] = await this.db
      .select({ id: athletes.id })
      .from(athletes)
      .where(eq(athletes.id, athleteId));
    if (!athlete) throw new NotFoundException(`Athlete ${athleteId} not found`);
  }

  async create(athleteId: string, dto: CreateSessionDto) {
    await this.ensureAthleteExists(athleteId);
    const [session] = await this.db
      .insert(trainingSessions)
      .values({ ...dto, athleteId })
      .returning();
    return withLoad(session);
  }

  async findAllForAthlete(athleteId: string, query: ListSessionsQueryDto) {
    await this.ensureAthleteExists(athleteId);
    const { from, to, page, limit } = query;

    const conditions: SQL[] = [eq(trainingSessions.athleteId, athleteId)];
    if (from) conditions.push(gte(trainingSessions.sessionDate, from));
    if (to) conditions.push(lte(trainingSessions.sessionDate, to));
    const where = and(...conditions);

    const [data, [{ total }]] = await Promise.all([
      this.db
        .select()
        .from(trainingSessions)
        .where(where)
        .orderBy(desc(trainingSessions.sessionDate))
        .limit(limit)
        .offset((page - 1) * limit),
      this.db.select({ total: count() }).from(trainingSessions).where(where),
    ]);

    return {
      data: data.map(withLoad),
      meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  async findOne(id: string) {
    const [session] = await this.db
      .select()
      .from(trainingSessions)
      .where(eq(trainingSessions.id, id));
    if (!session) throw new NotFoundException(`Session ${id} not found`);
    return withLoad(session);
  }

  async update(id: string, dto: UpdateSessionDto) {
    const [session] = await this.db
      .update(trainingSessions)
      .set(dto)
      .where(eq(trainingSessions.id, id))
      .returning();
    if (!session) throw new NotFoundException(`Session ${id} not found`);
    return withLoad(session);
  }

  async remove(id: string): Promise<void> {
    const [session] = await this.db
      .delete(trainingSessions)
      .where(eq(trainingSessions.id, id))
      .returning({ id: trainingSessions.id });
    if (!session) throw new NotFoundException(`Session ${id} not found`);
  }
}
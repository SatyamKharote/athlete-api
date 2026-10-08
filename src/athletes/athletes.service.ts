import { ConflictException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { count, desc, eq, ilike, or } from 'drizzle-orm';
import { DRIZZLE, type DrizzleDB } from '../db/db.module.js';
import { athletes } from '../db/schema.js';
import { CreateAthleteDto } from './dto/create-athlete.dto.js';
import { UpdateAthleteDto } from './dto/update-athlete.dto.js';
import { ListAthletesQueryDto } from './dto/list-athletes-query.dto.js';

function isUniqueViolation(error: unknown): boolean {
  const e = error as { code?: string; cause?: { code?: string } };
  return e.code === '23505' || e.cause?.code === '23505';

}

@Injectable()
export class AthletesService {
  constructor(@Inject(DRIZZLE) private readonly db: DrizzleDB) {}

  async create(dto: CreateAthleteDto) {
    try {
      const [athlete] = await this.db.insert(athletes).values(dto).returning();
      return athlete;
    } catch (error) {
      if (isUniqueViolation(error)) {
        throw new ConflictException('An athlete with this email already exists');
      }
      throw error;
    }
  }

  async findAll(query: ListAthletesQueryDto) {
    const { search, page, limit } = query;
    const where = search
      ? or(ilike(athletes.name, `%${search}%`), ilike(athletes.email, `%${search}%`))
      : undefined;

    const [data, [{ total }]] = await Promise.all([
      this.db
        .select()
        .from(athletes)
        .where(where)
        .orderBy(desc(athletes.createdAt))
        .limit(limit)
        .offset((page - 1) * limit),
      this.db.select({ total: count() }).from(athletes).where(where),
    ]);

    return {
      data,
      meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  async findOne(id: string) {
    const [athlete] = await this.db.select().from(athletes).where(eq(athletes.id, id));
    if (!athlete) throw new NotFoundException(`Athlete ${id} not found`);
    return athlete;
  }

  async update(id: string, dto: UpdateAthleteDto) {
    try {
      const [athlete] = await this.db
        .update(athletes)
        .set(dto)
        .where(eq(athletes.id, id))
        .returning();
      if (!athlete) throw new NotFoundException(`Athlete ${id} not found`);
      return athlete;
    } catch (error) {
      if (isUniqueViolation(error)) {
        throw new ConflictException('An athlete with this email already exists');
      }
      throw error;
    }
  }

  async remove(id: string): Promise<void> {
    const [athlete] = await this.db
      .delete(athletes)
      .where(eq(athletes.id, id))
      .returning({ id: athletes.id });
    if (!athlete) throw new NotFoundException(`Athlete ${id} not found`);
  }
}
# Athlete Training API

Athlete Training API: athletes, training sessions and weekly training-load analytics.

## Live links

| | |
|---|---|
| API docs (Swagger) | http://13.201.167.204:3000/api |
| Frontend | http://athlete-training-satyam.s3-website.ap-south-1.amazonaws.com/ |
| Frontend repo | https://github.com/SatyamKharote/athlete-web |

## Tech stack

- **NestJS** + **TypeScript**
- **PostgreSQL 16**
- **Drizzle ORM** (with `node-postgres`)
- **class-validator** / **class-transformer** for request validation
- **Swagger** (`@nestjs/swagger`) for API docs at `/api`
- **Docker Compose** for the API and database
- **AWS EC2** for hosting

## Endpoints

| Method | Path | Description |
|---|---|---|
| `GET` | `/` | Health check: confirms the DB connection and returns the athlete count |
| `POST` | `/athletes` | Create an athlete |
| `GET` | `/athletes` | List athletes. Query: `search` (name or email, case-insensitive), `page` (default 1), `limit` (default 10, max 100) |
| `GET` | `/athletes/:id` | Get one athlete |
| `PATCH` | `/athletes/:id` | Partially update an athlete |
| `DELETE` | `/athletes/:id` | Delete an athlete and their sessions (`204`) |
| `POST` | `/athletes/:athleteId/sessions` | Create a training session for an athlete |
| `GET` | `/athletes/:athleteId/sessions` | List an athlete's sessions, newest first. Query: `from`, `to` (YYYY-MM-DD), `page`, `limit` |
| `GET` | `/athletes/:athleteId/training-load` | Weekly training load. Query: optional `from`, `to` |
| `GET` | `/sessions/:id` | Get one session |
| `PATCH` | `/sessions/:id` | Partially update a session |
| `DELETE` | `/sessions/:id` | Delete a session (`204`) |

List endpoints return `{ data, meta: { page, limit, total, totalPages } }`. Every session in a response includes a computed `trainingLoad` field.

## Data model

`athletes` 1 ──< many `training_sessions`. The schema is in `db/init.sql`, which Postgres runs on first start; the matching Drizzle schema is in `src/db/schema.ts`.

**athletes**

| Column | Type | Constraints |
|---|---|---|
| `id` | `uuid` | Primary key, `gen_random_uuid()` |
| `name` | `text` | Not null |
| `email` | `text` | Not null, **unique** |
| `sport` | `text` | Not null |
| `created_at` | `timestamptz` | Not null, default `now()` |

**training_sessions**

| Column | Type | Constraints |
|---|---|---|
| `id` | `uuid` | Primary key, `gen_random_uuid()` |
| `athlete_id` | `uuid` | Not null, FK → `athletes(id)` **`ON DELETE CASCADE`** |
| `session_date` | `date` | Not null |
| `type` | `text` | Not null (API allows `Batting`, `Bowling`, `Fielding`, `Strength`, `Sprint`, `Recovery`) |
| `duration_min` | `int` | Not null, `CHECK (duration_min > 0)` |
| `rpe` | `int` | Not null, `CHECK (rpe BETWEEN 1 AND 10)` |
| `notes` | `text` | Nullable |
| `created_at` | `timestamptz` | Not null, default `now()` |

**Index:** `idx_sessions_athlete_date ON training_sessions (athlete_id, session_date)`.

All session queries filter by one athlete and then by a date range, or sort or group by date. With `athlete_id` as the leading column and `session_date` second, Postgres can jump straight to one athlete's rows and range-scan them in date order. It doesn't have to scan the whole table, which `init.sql` seeds with 100,000 sessions (200 athletes × 500 sessions).

## Training load

Each session's load is calculated with the session-RPE method:

```
training load = duration (minutes) × RPE (1–10)
```

A 60-minute session at RPE 7 has a load of 420.

### Weekly endpoint

`GET /athletes/:athleteId/training-load` runs one SQL query (`src/sessions/sessions.service.ts`):

1. **CTE (`weekly`)**: groups the athlete's sessions by `date_trunc('week', session_date)`, which gives ISO weeks starting on Monday. For each week it calculates the session count, total minutes and `SUM(duration_min * rpe)` as the weekly load.
2. **`LAG` window function**: `weekly_load - LAG(weekly_load) OVER (ORDER BY week_start)` gives the change from the previous week that has data. The first week returns `null`.
3. **Parameterised SQL**: the query uses Drizzle's `sql` tagged template, so `athleteId`, `from` and `to` are sent as bound parameters and never concatenated into the query. If `from` or `to` is omitted, it is passed as `NULL`, and the `(${from}::date IS NULL OR session_date >= ${from}::date)` check turns that filter off.

Example response:

```json
[
  { "weekStart": "2026-07-06", "sessions": 5, "totalMinutes": 340, "weeklyLoad": 1980, "changeFromLastWeek": null },
  { "weekStart": "2026-07-13", "sessions": 6, "totalMinutes": 410, "weeklyLoad": 2350, "changeFromLastWeek": 370 }
]
```

## Validation and error handling

A global `ValidationPipe` runs with `whitelist`, `forbidNonWhitelisted` and `transform` turned on.

| Status | When |
|---|---|
| `400 Bad Request` | The body or query fails a DTO rule: invalid email, empty name, `rpe` outside 1–10, `durationMin` outside 1–600, unknown `type`, bad date, `limit` above 100, and so on. Unknown fields also return 400, and so do path IDs that are not valid UUIDs (`ParseUUIDPipe`). |
| `404 Not Found` | The athlete or session doesn't exist. Session create, list and training-load requests also return 404 if the athlete doesn't exist. |
| `409 Conflict` | An athlete create or update uses an email that is already taken (Postgres unique violation `23505`). |

## Running locally

Requires Docker.

```bash
docker compose up --build
```

- API: http://localhost:3000
- Swagger docs: http://localhost:3000/api
- Postgres: `localhost:5433` (user `postgres`, password `admin`, database `athletes`)

On first start, `db/init.sql` creates the tables and index and seeds sample data. It runs only when the `pgdata` volume is empty, so run `docker compose down -v` to reset the database.

To run the API on your machine against the containerised database:

```bash
docker compose up -d db
npm install
DATABASE_URL=postgres://postgres:admin@localhost:5433/athletes npm run start:dev
```

## Deployment

- Runs on an **AWS EC2** instance (t3.micro) using the same `docker-compose.yml`. The Dockerfile is a multi-stage build on `node:24-alpine`, and the final image contains only production dependencies.
- The EC2 **security group exposes only port 3000** (the API). Compose publishes Postgres on host port 5433, but the security group doesn't open that port, so the database can't be reached from the internet.
- A **swap file was added** on the t3.micro, which has only 1 GB of RAM, to give the Docker image build (`npm ci`, `nest build`) and the running containers more memory headroom.
- The frontend is a static site hosted on S3, and it calls the API on port 3000. CORS is enabled in `main.ts`.

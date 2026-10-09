CREATE TABLE athletes (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name        text NOT NULL,
  email       text NOT NULL UNIQUE,
  sport       text NOT NULL,
  created_at  timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE training_sessions (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  athlete_id    uuid NOT NULL REFERENCES athletes(id) ON DELETE CASCADE,
  session_date  date NOT NULL,
  type          text NOT NULL,
  duration_min  int  NOT NULL CHECK (duration_min > 0),
  rpe           int  NOT NULL CHECK (rpe BETWEEN 1 AND 10),
  notes         text,
  created_at    timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_sessions_athlete_date ON training_sessions (athlete_id, session_date);

INSERT INTO athletes (name, email, sport)
SELECT 'Athlete ' || i, 'athlete' || i || '@test.com',
       (ARRAY['Cricket','Athletics','Swimming','Football'])[1 + (i % 4)]
FROM generate_series(1, 200) AS i;

INSERT INTO training_sessions (athlete_id, session_date, type, duration_min, rpe)
SELECT a.id,
       DATE '2026-07-01' + (random() * 90)::int,
       (ARRAY['Batting','Bowling','Strength','Sprint','Recovery'])[1 + floor(random() * 5)::int],
       20 + floor(random() * 100)::int,
       1 + floor(random() * 10)::int
FROM athletes a, generate_series(1, 500);
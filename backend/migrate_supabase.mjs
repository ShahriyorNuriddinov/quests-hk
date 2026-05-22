import pg from 'pg'
const { Pool } = pg

// + encoded as %2B
const pool = new Pool({
  connectionString: 'postgresql://postgres:D9MxgHk9Xq7t%2BDY@db.qudejfvvzymqojgzkdlc.supabase.co:5432/postgres',
  ssl: { rejectUnauthorized: false }
})

try {
  await pool.query(`
    CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

    CREATE TABLE IF NOT EXISTS users (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      email TEXT NOT NULL UNIQUE,
      role TEXT NOT NULL DEFAULT 'user',
      otp_code TEXT,
      otp_expires TIMESTAMPTZ,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS quests (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      title TEXT NOT NULL,
      description TEXT,
      duration TEXT,
      distance TEXT,
      difficulty TEXT NOT NULL DEFAULT 'Легко',
      price NUMERIC NOT NULL DEFAULT 0,
      currency TEXT NOT NULL DEFAULT 'HK$',
      locations_count INTEGER NOT NULL DEFAULT 0,
      questions_count INTEGER NOT NULL DEFAULT 0,
      transport_cost TEXT,
      start_point TEXT,
      end_point TEXT,
      cover_image TEXT,
      status TEXT NOT NULL DEFAULT 'draft',
      rating NUMERIC NOT NULL DEFAULT 5,
      completed_count INTEGER NOT NULL DEFAULT 0,
      steps JSONB NOT NULL DEFAULT '[]',
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS reviews (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      quest_id UUID NOT NULL REFERENCES quests(id) ON DELETE CASCADE,
      rating INTEGER NOT NULL,
      text TEXT,
      photos JSONB NOT NULL DEFAULT '[]',
      approved BOOLEAN NOT NULL DEFAULT false,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      CONSTRAINT reviews_user_quest_unique UNIQUE (user_id, quest_id)
    );

    CREATE TABLE IF NOT EXISTS promo_codes (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      code TEXT NOT NULL UNIQUE,
      discount NUMERIC NOT NULL,
      type TEXT NOT NULL DEFAULT 'percent',
      used_count INTEGER NOT NULL DEFAULT 0,
      max_uses INTEGER NOT NULL DEFAULT 100,
      active BOOLEAN NOT NULL DEFAULT true,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS user_quests (
      user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      quest_id UUID NOT NULL REFERENCES quests(id) ON DELETE CASCADE,
      purchased_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      progress JSONB DEFAULT NULL,
      completed BOOLEAN NOT NULL DEFAULT FALSE,
      PRIMARY KEY (user_id, quest_id)
    );
  `)
  console.log('✅ Supabase schema created!')
} catch (e) {
  console.error('❌ Error:', e.message)
}
await pool.end()

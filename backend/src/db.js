import pg from 'pg'
const { Pool } = pg

export const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/questshk',
  ssl: process.env.DATABASE_URL?.includes('supabase.co') ? { rejectUnauthorized: false } : false,
})

pool.on('error', (err) => console.error('Unexpected DB error', err))

export async function initDb() {
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
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
    ALTER TABLE reviews ADD COLUMN IF NOT EXISTS photos JSONB NOT NULL DEFAULT '[]';

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
      PRIMARY KEY (user_id, quest_id)
    );
    ALTER TABLE user_quests ADD COLUMN IF NOT EXISTS purchased_at TIMESTAMPTZ NOT NULL DEFAULT NOW();
    ALTER TABLE user_quests ADD COLUMN IF NOT EXISTS progress JSONB DEFAULT NULL;
    ALTER TABLE user_quests ADD COLUMN IF NOT EXISTS completed BOOLEAN NOT NULL DEFAULT FALSE;

    -- Promo code partner fields
    ALTER TABLE promo_codes ADD COLUMN IF NOT EXISTS partner_name TEXT DEFAULT '';
    ALTER TABLE promo_codes ADD COLUMN IF NOT EXISTS partner_description TEXT DEFAULT '';
    ALTER TABLE promo_codes ADD COLUMN IF NOT EXISTS earnings_accumulated NUMERIC NOT NULL DEFAULT 0;
    ALTER TABLE promo_codes ADD COLUMN IF NOT EXISTS earnings_total NUMERIC NOT NULL DEFAULT 0;

    -- Quest gallery images
    ALTER TABLE quests ADD COLUMN IF NOT EXISTS gallery_images JSONB DEFAULT '[]';
    -- Quest city
    ALTER TABLE quests ADD COLUMN IF NOT EXISTS city TEXT DEFAULT 'hk';

    CREATE INDEX IF NOT EXISTS idx_quests_status ON quests(status);
    CREATE INDEX IF NOT EXISTS idx_reviews_quest_id ON reviews(quest_id);
    CREATE INDEX IF NOT EXISTS idx_reviews_approved ON reviews(quest_id, approved);
    CREATE INDEX IF NOT EXISTS idx_user_quests_quest_id ON user_quests(quest_id);
  `)
  console.log('Database initialized')
}

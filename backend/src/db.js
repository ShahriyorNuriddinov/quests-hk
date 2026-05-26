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
    ALTER TABLE promo_codes ADD COLUMN IF NOT EXISTS commission_rate NUMERIC NOT NULL DEFAULT 0;
    ALTER TABLE promo_codes ADD COLUMN IF NOT EXISTS commission_type TEXT NOT NULL DEFAULT 'percent';

    -- Quest gallery images
    ALTER TABLE quests ADD COLUMN IF NOT EXISTS gallery_images JSONB DEFAULT '[]';
    -- Quest city
    ALTER TABLE quests ADD COLUMN IF NOT EXISTS city TEXT DEFAULT 'hk';

    -- Cities management
    CREATE TABLE IF NOT EXISTS cities (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      code TEXT NOT NULL UNIQUE,
      name TEXT NOT NULL,
      flag TEXT NOT NULL DEFAULT '',
      active BOOLEAN NOT NULL DEFAULT false,
      sort_order INTEGER NOT NULL DEFAULT 0,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    -- Seed default cities if empty
    INSERT INTO cities (code, name, flag, active, sort_order)
    VALUES
      ('hk', 'Hong Kong', '🇭🇰', true, 0),
      ('macau', 'Macau', '🇲🇴', false, 1),
      ('guangzhou', 'Guangzhou', '🇨🇳', false, 2)
    ON CONFLICT (code) DO NOTHING;

    -- Quest step photos (uploaded during play)
    CREATE TABLE IF NOT EXISTS quest_photos (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      quest_id UUID NOT NULL REFERENCES quests(id) ON DELETE CASCADE,
      step_index INTEGER NOT NULL DEFAULT 0,
      photo_url TEXT NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    -- User profile extensions
    ALTER TABLE users ADD COLUMN IF NOT EXISTS display_name TEXT;
    ALTER TABLE users ADD COLUMN IF NOT EXISTS avatar_color TEXT DEFAULT '#FFD600';

    -- Gamification: user achievements
    CREATE TABLE IF NOT EXISTS user_achievements (
      user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      code TEXT NOT NULL,
      earned_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      PRIMARY KEY (user_id, code)
    );

    -- Review helpful votes
    CREATE TABLE IF NOT EXISTS review_votes (
      user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      review_id UUID NOT NULL REFERENCES reviews(id) ON DELETE CASCADE,
      PRIMARY KEY (user_id, review_id)
    );

    -- Admin events / announcements
    CREATE TABLE IF NOT EXISTS events (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      title TEXT NOT NULL,
      text TEXT,
      image_url TEXT,
      active BOOLEAN NOT NULL DEFAULT true,
      sort_order INTEGER NOT NULL DEFAULT 0,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    -- City launch notification signups
    CREATE TABLE IF NOT EXISTS city_notifications (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      email TEXT NOT NULL,
      city_code TEXT NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      UNIQUE(email, city_code)
    );

    -- Partner system
    ALTER TABLE quests ADD COLUMN IF NOT EXISTS partner_id UUID REFERENCES users(id) ON DELETE SET NULL;

    CREATE TABLE IF NOT EXISTS partner_profiles (
      user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
      business_name TEXT,
      payout_percent INTEGER NOT NULL DEFAULT 70,
      payout_details TEXT,
      created_at TIMESTAMPTZ DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS partner_earnings (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      partner_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      quest_id UUID REFERENCES quests(id) ON DELETE SET NULL,
      buyer_id UUID REFERENCES users(id) ON DELETE SET NULL,
      amount NUMERIC(10,2) NOT NULL,
      total_price NUMERIC(10,2) NOT NULL,
      paid_out BOOLEAN NOT NULL DEFAULT false,
      created_at TIMESTAMPTZ DEFAULT NOW()
    );

    CREATE INDEX IF NOT EXISTS idx_quests_status ON quests(status);
    CREATE INDEX IF NOT EXISTS idx_reviews_quest_id ON reviews(quest_id);
    CREATE INDEX IF NOT EXISTS idx_reviews_approved ON reviews(quest_id, approved);
    CREATE INDEX IF NOT EXISTS idx_user_quests_quest_id ON user_quests(quest_id);
    CREATE INDEX IF NOT EXISTS idx_quest_photos_user_quest ON quest_photos(user_id, quest_id);
  `)
  console.log('Database initialized')
}

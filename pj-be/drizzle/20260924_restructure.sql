CREATE TABLE IF NOT EXISTS cities (
  id bigserial PRIMARY KEY, name_vi text, name_en text, slug varchar(255)
);
CREATE TABLE IF NOT EXISTS spas (
  id uuid PRIMARY KEY, name text, slug varchar(255), address text, phone text,
  description text, messaging_link_zalo text, spa_avatar text,
  created_at timestamptz DEFAULT now()
);
CREATE TABLE IF NOT EXISTS deals (
  id bigserial PRIMARY KEY, spa_id uuid, city_id bigint,
  slug_vi varchar(255), title_vi varchar(500), title_en varchar(500),
  short_description_vi text, cover_image_url text, discount_percent varchar(20), end_at timestamptz,
  created_at timestamptz DEFAULT now()
);
CREATE TABLE IF NOT EXISTS spa_locations (
  id bigserial PRIMARY KEY, spa_id uuid, city_id bigint, is_primary boolean
);

CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY, phone varchar(20) NOT NULL UNIQUE,
  password_hash text NOT NULL, full_name text NOT NULL,
  role varchar(20) NOT NULL CHECK (role IN ('user', 'spa_owner', 'admin')),
  status varchar(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'banned')),
  created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS one_admin_only ON users (role) WHERE role = 'admin';

ALTER TABLE spas ADD COLUMN IF NOT EXISTS owner_id uuid REFERENCES users(id);
ALTER TABLE spas ADD COLUMN IF NOT EXISTS city_id bigint REFERENCES cities(id);
ALTER TABLE spas ADD COLUMN IF NOT EXISTS approval_status varchar(20) NOT NULL DEFAULT 'pending';
ALTER TABLE deals ADD COLUMN IF NOT EXISTS approval_status varchar(20) NOT NULL DEFAULT 'pending';
ALTER TABLE deals ADD COLUMN IF NOT EXISTS price_vnd integer;
ALTER TABLE deals ADD COLUMN IF NOT EXISTS end_at timestamptz;

CREATE TABLE IF NOT EXISTS saved_spas (
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  spa_id uuid NOT NULL REFERENCES spas(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(), PRIMARY KEY (user_id, spa_id)
);
CREATE TABLE IF NOT EXISTS reviews (
  id uuid PRIMARY KEY, user_id uuid NOT NULL REFERENCES users(id),
  spa_id uuid NOT NULL REFERENCES spas(id), rating integer NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment text NOT NULL, created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, spa_id)
);
CREATE TABLE IF NOT EXISTS bookings (
  id uuid PRIMARY KEY, user_id uuid NOT NULL REFERENCES users(id),
  spa_id uuid NOT NULL REFERENCES spas(id), deal_id bigint REFERENCES deals(id),
  status varchar(20) NOT NULL DEFAULT 'pending', scheduled_at timestamptz NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS bookings_user_idx ON bookings(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS bookings_spa_idx ON bookings(spa_id, scheduled_at DESC);
CREATE INDEX IF NOT EXISTS spas_city_approval_idx ON spas(city_id, approval_status);
CREATE INDEX IF NOT EXISTS deals_approval_idx ON deals(approval_status, spa_id);
CREATE INDEX IF NOT EXISTS deals_expiry_idx ON deals(approval_status, end_at);

CREATE SEQUENCE IF NOT EXISTS deals_id_seq;
SELECT setval('deals_id_seq', GREATEST((SELECT COALESCE(MAX(id), 0) FROM deals), 1));
ALTER TABLE deals ALTER COLUMN id SET DEFAULT nextval('deals_id_seq');

UPDATE spas SET city_id = (
  SELECT sl.city_id FROM spa_locations sl WHERE sl.spa_id = spas.id AND sl.city_id IS NOT NULL
  ORDER BY sl.is_primary DESC NULLS LAST, sl.id LIMIT 1
) WHERE city_id IS NULL;
UPDATE deals SET city_id = spas.city_id FROM spas WHERE deals.spa_id = spas.id AND deals.city_id IS NULL;
UPDATE spas SET approval_status = 'approved' WHERE owner_id IS NULL;
UPDATE deals SET approval_status = 'approved' WHERE spa_id IN (SELECT id FROM spas WHERE owner_id IS NULL);

DROP TABLE IF EXISTS banners CASCADE;
DROP TABLE IF EXISTS tracking_events CASCADE;
DROP TABLE IF EXISTS entity_fake_engagement CASCADE;
ALTER TABLE spas DROP COLUMN IF EXISTS messaging_link_whatsapp;
ALTER TABLE spas DROP COLUMN IF EXISTS messaging_link_telegram;
ALTER TABLE spas DROP COLUMN IF EXISTS messaging_link_messenger;
ALTER TABLE spas DROP COLUMN IF EXISTS messaging_link_kakaotalk;
ALTER TABLE spas DROP COLUMN IF EXISTS website;
ALTER TABLE spas DROP COLUMN IF EXISTS facebook_link;
ALTER TABLE spas DROP COLUMN IF EXISTS instagram_link;
ALTER TABLE spas DROP COLUMN IF EXISTS twitter_link;

DO $$
DECLARE item record;
BEGIN
  FOR item IN SELECT table_schema, table_name, column_name FROM information_schema.columns
    WHERE table_schema = 'public' AND column_name LIKE '%\_ko' ESCAPE '\'
  LOOP
    EXECUTE format('ALTER TABLE %I.%I DROP COLUMN IF EXISTS %I CASCADE', item.table_schema, item.table_name, item.column_name);
  END LOOP;
END $$;

ALTER TABLE "banners"
  ADD COLUMN IF NOT EXISTS "locale" varchar(10);

CREATE INDEX IF NOT EXISTS "banners_placement_locale_enabled_order_idx"
  ON "banners" USING btree ("placement", "locale", "is_enabled", "display_order");

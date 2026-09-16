ALTER TABLE "banners"
  ADD COLUMN IF NOT EXISTS "name_vi" varchar(255),
  ADD COLUMN IF NOT EXISTS "name_en" varchar(255),
  ADD COLUMN IF NOT EXISTS "name_ko" varchar(255),
  ADD COLUMN IF NOT EXISTS "image_url_vi" text,
  ADD COLUMN IF NOT EXISTS "image_url_en" text,
  ADD COLUMN IF NOT EXISTS "image_url_ko" text;
--> statement-breakpoint
WITH grouped AS (
  SELECT
    MIN(id) AS canonical_id,
    placement,
    COALESCE(slot_number, -1) AS slot_key,
    target_url,
    ga_click_tag,
    is_enabled,
    display_order
  FROM banners
  GROUP BY placement, COALESCE(slot_number, -1), target_url, ga_click_tag, is_enabled, display_order
),
localized AS (
  SELECT
    g.canonical_id,
    MAX(CASE WHEN b.locale = 'vi' THEN b.name END) AS vi_name,
    MAX(CASE WHEN b.locale = 'en' THEN b.name END) AS en_name,
    MAX(CASE WHEN b.locale = 'ko' THEN b.name END) AS ko_name,
    MAX(CASE WHEN b.locale = 'vi' THEN b.image_url END) AS vi_image,
    MAX(CASE WHEN b.locale = 'en' THEN b.image_url END) AS en_image,
    MAX(CASE WHEN b.locale = 'ko' THEN b.image_url END) AS ko_image,
    MAX(CASE WHEN b.locale IS NULL THEN b.name END) AS default_name,
    MAX(CASE WHEN b.locale IS NULL THEN b.image_url END) AS default_image
  FROM grouped g
  JOIN banners b
    ON b.placement = g.placement
   AND COALESCE(b.slot_number, -1) = g.slot_key
   AND b.target_url = g.target_url
   AND b.is_enabled = g.is_enabled
   AND b.display_order = g.display_order
   AND (
     (b.ga_click_tag IS NULL AND g.ga_click_tag IS NULL)
     OR b.ga_click_tag = g.ga_click_tag
   )
  GROUP BY g.canonical_id
)
UPDATE banners base
SET
  name = COALESCE(localized.vi_name, localized.default_name, base.name),
  name_vi = COALESCE(localized.vi_name, localized.default_name, base.name),
  name_en = COALESCE(localized.en_name, base.name_en),
  name_ko = COALESCE(localized.ko_name, base.name_ko),
  image_url = COALESCE(localized.vi_image, localized.default_image, base.image_url),
  image_url_vi = COALESCE(localized.vi_image, localized.default_image, base.image_url),
  image_url_en = COALESCE(localized.en_image, base.image_url_en),
  image_url_ko = COALESCE(localized.ko_image, base.image_url_ko)
FROM localized
WHERE base.id = localized.canonical_id;
--> statement-breakpoint
DELETE FROM banners b
USING (
  SELECT
    MIN(id) AS canonical_id,
    placement,
    COALESCE(slot_number, -1) AS slot_key,
    target_url,
    ga_click_tag,
    is_enabled,
    display_order
  FROM banners
  GROUP BY placement, COALESCE(slot_number, -1), target_url, ga_click_tag, is_enabled, display_order
) grouped
WHERE b.placement = grouped.placement
  AND COALESCE(b.slot_number, -1) = grouped.slot_key
  AND b.target_url = grouped.target_url
  AND b.is_enabled = grouped.is_enabled
  AND b.display_order = grouped.display_order
  AND (
    (b.ga_click_tag IS NULL AND grouped.ga_click_tag IS NULL)
    OR b.ga_click_tag = grouped.ga_click_tag
  )
  AND b.id <> grouped.canonical_id;
--> statement-breakpoint
UPDATE "banners"
SET
  "name_vi" = COALESCE(NULLIF("name_vi", ''), "name"),
  "image_url_vi" = COALESCE(NULLIF("image_url_vi", ''), "image_url");

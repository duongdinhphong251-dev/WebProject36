ALTER TABLE "spas" ADD COLUMN "amenities" text[];

UPDATE "spas"
SET "amenities" = ARRAY(
  SELECT key
  FROM jsonb_each(
    COALESCE("parking_options", '{}'::jsonb) || 
    COALESCE("payment_options", '{}'::jsonb) || 
    COALESCE("accessibility_options", '{}'::jsonb)
  )
  WHERE value = 'true'::jsonb
)
WHERE "parking_options" IS NOT NULL OR "payment_options" IS NOT NULL OR "accessibility_options" IS NOT NULL;

ALTER TABLE "spas" DROP COLUMN "parking_options";
ALTER TABLE "spas" DROP COLUMN "payment_options";
ALTER TABLE "spas" DROP COLUMN "accessibility_options";
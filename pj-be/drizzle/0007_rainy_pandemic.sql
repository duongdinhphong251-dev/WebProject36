ALTER TABLE "banners" DROP COLUMN IF EXISTS "spa_id";
ALTER TABLE "banners" ADD COLUMN "spa_id" uuid;
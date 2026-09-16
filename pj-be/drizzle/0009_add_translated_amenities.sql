-- Custom SQL migration file, put your code below! --
ALTER TABLE "spas" ADD COLUMN "amenities_en" text[];
ALTER TABLE "spas" ADD COLUMN "amenities_ko" text[];
CREATE TABLE IF NOT EXISTS "banners" (
  "id" bigserial PRIMARY KEY NOT NULL,
  "name" varchar(255) NOT NULL,
  "placement" varchar(50) NOT NULL,
  "slot_number" integer,
  "image_url" text NOT NULL,
  "target_url" text NOT NULL,
  "ga_click_tag" varchar(255),
  "is_enabled" boolean DEFAULT true NOT NULL,
  "display_order" integer DEFAULT 0 NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "banners_placement_enabled_order_idx" ON "banners" USING btree ("placement","is_enabled","display_order");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "banners_placement_slot_idx" ON "banners" USING btree ("placement","slot_number");

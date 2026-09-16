CREATE TABLE "spa_services" (
	"spa_id" uuid NOT NULL,
	"service_id" bigint NOT NULL,
	CONSTRAINT "spa_services_pkey" PRIMARY KEY("spa_id","service_id")
);
CREATE TABLE "entity_fake_engagement" (
	"entity_type" varchar(10) NOT NULL,
	"entity_id" varchar(64) NOT NULL,
	"fake_count" integer NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "entity_fake_engagement_entity_type_entity_id_pk" PRIMARY KEY("entity_type","entity_id")
);
CREATE TABLE "banners" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"name" varchar(255) NOT NULL,
	"name_vi" varchar(255),
	"name_en" varchar(255),
	"name_ko" varchar(255),
	"placement" varchar(50) NOT NULL,
	"slot_number" integer,
	"image_url" text NOT NULL,
	"image_url_vi" text,
	"image_url_en" text,
	"image_url_ko" text,
	"target_url" text NOT NULL,
	"ga_click_tag" varchar(255),
	"is_enabled" boolean DEFAULT true NOT NULL,
	"display_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
CREATE INDEX "spa_services_spa_id_idx" ON "spa_services" USING btree ("spa_id");
CREATE INDEX "spa_services_service_id_idx" ON "spa_services" USING btree ("service_id");
CREATE INDEX "banners_placement_enabled_order_idx" ON "banners" USING btree ("placement","is_enabled","display_order");
CREATE INDEX "banners_placement_slot_idx" ON "banners" USING btree ("placement","slot_number");
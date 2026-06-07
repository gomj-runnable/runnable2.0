CREATE EXTENSION IF NOT EXISTS postgis;--> statement-breakpoint
ALTER TABLE "route_sections" DROP COLUMN IF EXISTS "geom";--> statement-breakpoint
ALTER TABLE "route_sections" DROP COLUMN IF EXISTS "pois";--> statement-breakpoint
ALTER TABLE "route_sections" ADD COLUMN IF NOT EXISTS "geom" geometry(LineStringZ, 4326);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "section_geom_idx" ON "route_sections" USING gist ("geom");--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "route_section_pois" (
	"poi_id" text PRIMARY KEY NOT NULL,
	"section_id" text NOT NULL,
	"type" varchar(50) NOT NULL,
	"name" varchar(255) NOT NULL,
	"description" text,
	"attribute" jsonb
);--> statement-breakpoint
ALTER TABLE "route_section_pois" ADD COLUMN IF NOT EXISTS "geom" geometry(PointZ, 4326);--> statement-breakpoint
ALTER TABLE "route_section_pois" ADD CONSTRAINT "route_section_pois_section_id_route_sections_section_id_fk" FOREIGN KEY ("section_id") REFERENCES "route_sections"("section_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "poi_section_idx" ON "route_section_pois" ("section_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "poi_geom_idx" ON "route_section_pois" USING gist ("geom");--> statement-breakpoint
ALTER TABLE "route_infos" DROP COLUMN IF EXISTS "longitude";--> statement-breakpoint
ALTER TABLE "route_infos" DROP COLUMN IF EXISTS "latitude";--> statement-breakpoint
ALTER TABLE "route_infos" DROP COLUMN IF EXISTS "elevation";--> statement-breakpoint
ALTER TABLE "route_infos" ADD COLUMN IF NOT EXISTS "geom" geometry(PointZ, 4326);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "route_info_geom_idx" ON "route_infos" USING gist ("geom");

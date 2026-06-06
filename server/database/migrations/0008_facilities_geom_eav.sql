CREATE EXTENSION IF NOT EXISTS postgis;--> statement-breakpoint
ALTER TABLE "facilities" DROP COLUMN IF EXISTS "lng";--> statement-breakpoint
ALTER TABLE "facilities" DROP COLUMN IF EXISTS "lat";--> statement-breakpoint
ALTER TABLE "facilities" DROP COLUMN IF EXISTS "hours";--> statement-breakpoint
ALTER TABLE "facilities" DROP COLUMN IF EXISTS "tel";--> statement-breakpoint
ALTER TABLE "facilities" DROP COLUMN IF EXISTS "has_signal";--> statement-breakpoint
ALTER TABLE "facilities" DROP COLUMN IF EXISTS "polyline";--> statement-breakpoint
ALTER TABLE "facilities" ADD COLUMN IF NOT EXISTS "geom" geometry(Geometry, 4326);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "facility_geom_idx" ON "facilities" USING gist ("geom");

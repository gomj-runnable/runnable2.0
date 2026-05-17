CREATE TABLE "segment_efforts" (
	"effort_id" text PRIMARY KEY NOT NULL,
	"segment_id" text NOT NULL,
	"user_id" text NOT NULL,
	"duration_sec" integer NOT NULL,
	"pace_sec_per_km" numeric(8, 2) NOT NULL,
	"completed_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "segments" (
	"segment_id" text PRIMARY KEY NOT NULL,
	"owner_id" text NOT NULL,
	"name" varchar(100) NOT NULL,
	"description" text,
	"route_id" text NOT NULL,
	"start_position_index" integer NOT NULL,
	"end_position_index" integer NOT NULL,
	"distance_km" numeric(8, 3) NOT NULL,
	"elevation_gain_m" numeric(8, 2),
	"is_public" boolean DEFAULT true NOT NULL,
	"effort_count" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "run_records" (
	"record_id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"route_id" text,
	"run_date" varchar(10) NOT NULL,
	"distance_km" numeric(8, 3) NOT NULL,
	"duration_sec" integer NOT NULL,
	"avg_pace_sec_per_km" numeric(8, 2) NOT NULL,
	"rpe" integer NOT NULL,
	"condition" varchar(10) NOT NULL,
	"sleep_hours" numeric(4, 1),
	"stress_level" integer,
	"pain_areas" jsonb,
	"weather_snapshot" jsonb,
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "curation_collections" (
	"collection_id" text PRIMARY KEY NOT NULL,
	"created_by" text NOT NULL,
	"title" varchar(100) NOT NULL,
	"description" text,
	"season" varchar(10) NOT NULL,
	"theme" varchar(30) NOT NULL,
	"valid_from" varchar(10) NOT NULL,
	"valid_to" varchar(10) NOT NULL,
	"cover_image_url" text,
	"route_count" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "curation_routes" (
	"curation_route_id" text PRIMARY KEY NOT NULL,
	"collection_id" text NOT NULL,
	"route_id" text NOT NULL,
	"recommended_hour_local" integer,
	"photo_url" text,
	"note" text,
	"sort_order" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
ALTER TABLE "segment_efforts" ADD CONSTRAINT "segment_efforts_segment_id_segments_segment_id_fk" FOREIGN KEY ("segment_id") REFERENCES "public"."segments"("segment_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "segment_efforts" ADD CONSTRAINT "segment_efforts_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "segments" ADD CONSTRAINT "segments_owner_id_users_id_fk" FOREIGN KEY ("owner_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "segments" ADD CONSTRAINT "segments_route_id_routes_route_id_fk" FOREIGN KEY ("route_id") REFERENCES "public"."routes"("route_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "run_records" ADD CONSTRAINT "run_records_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "run_records" ADD CONSTRAINT "run_records_route_id_routes_route_id_fk" FOREIGN KEY ("route_id") REFERENCES "public"."routes"("route_id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "curation_collections" ADD CONSTRAINT "curation_collections_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "curation_routes" ADD CONSTRAINT "curation_routes_collection_id_curation_collections_collection_id_fk" FOREIGN KEY ("collection_id") REFERENCES "public"."curation_collections"("collection_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "curation_routes" ADD CONSTRAINT "curation_routes_route_id_routes_route_id_fk" FOREIGN KEY ("route_id") REFERENCES "public"."routes"("route_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "effort_segment_idx" ON "segment_efforts" USING btree ("segment_id");--> statement-breakpoint
CREATE INDEX "effort_user_idx" ON "segment_efforts" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "effort_duration_idx" ON "segment_efforts" USING btree ("segment_id","duration_sec");--> statement-breakpoint
CREATE INDEX "segment_route_idx" ON "segments" USING btree ("route_id");--> statement-breakpoint
CREATE INDEX "segment_owner_idx" ON "segments" USING btree ("owner_id");--> statement-breakpoint
CREATE INDEX "segment_public_idx" ON "segments" USING btree ("is_public");--> statement-breakpoint
CREATE INDEX "run_record_user_idx" ON "run_records" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "run_record_date_idx" ON "run_records" USING btree ("user_id","run_date");--> statement-breakpoint
CREATE INDEX "run_record_route_idx" ON "run_records" USING btree ("route_id");--> statement-breakpoint
CREATE INDEX "curation_season_idx" ON "curation_collections" USING btree ("season");--> statement-breakpoint
CREATE INDEX "curation_valid_idx" ON "curation_collections" USING btree ("valid_from","valid_to");--> statement-breakpoint
CREATE INDEX "curation_route_collection_idx" ON "curation_routes" USING btree ("collection_id");
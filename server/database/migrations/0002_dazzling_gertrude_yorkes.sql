CREATE TABLE "route_infos" (
	"route_info_id" text PRIMARY KEY NOT NULL,
	"route_id" text NOT NULL,
	"user_id" text NOT NULL,
	"name" varchar(100) NOT NULL,
	"description" text NOT NULL,
	"longitude" numeric(12, 8) NOT NULL,
	"latitude" numeric(12, 8) NOT NULL,
	"elevation" numeric(10, 2),
	"author_name" varchar(100) NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "facilities" (
	"id" varchar(255) PRIMARY KEY NOT NULL,
	"type" varchar(50) NOT NULL,
	"name" varchar(255) NOT NULL,
	"description" text,
	"lng" numeric(12, 8) NOT NULL,
	"lat" numeric(12, 8) NOT NULL,
	"hours" varchar(255),
	"tel" varchar(100)
);
--> statement-breakpoint
DROP TABLE "route_feedbacks" CASCADE;--> statement-breakpoint
ALTER TABLE "route_sections" ADD COLUMN "pois" text;--> statement-breakpoint
ALTER TABLE "routes" ADD COLUMN "source_route_id" text;--> statement-breakpoint
ALTER TABLE "route_infos" ADD CONSTRAINT "route_infos_route_id_routes_route_id_fk" FOREIGN KEY ("route_id") REFERENCES "public"."routes"("route_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "route_infos" ADD CONSTRAINT "route_infos_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "route_info_route_idx" ON "route_infos" USING btree ("route_id");--> statement-breakpoint
CREATE INDEX "route_info_user_idx" ON "route_infos" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "facility_type_idx" ON "facilities" USING btree ("type");
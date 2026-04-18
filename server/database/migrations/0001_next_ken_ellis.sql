CREATE TABLE "route_feedbacks" (
	"feedback_id" text PRIMARY KEY NOT NULL,
	"route_id" text NOT NULL,
	"user_id" text,
	"content" text NOT NULL,
	"longitude" numeric(12, 8) NOT NULL,
	"latitude" numeric(12, 8) NOT NULL,
	"elevation" numeric(10, 2),
	"author_name" varchar(100),
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "routes" ADD COLUMN "sgg" text;--> statement-breakpoint
ALTER TABLE "routes" ADD COLUMN "emd" text;--> statement-breakpoint
ALTER TABLE "route_feedbacks" ADD CONSTRAINT "route_feedbacks_route_id_routes_route_id_fk" FOREIGN KEY ("route_id") REFERENCES "public"."routes"("route_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "route_feedbacks" ADD CONSTRAINT "route_feedbacks_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "feedback_route_idx" ON "route_feedbacks" USING btree ("route_id");--> statement-breakpoint
CREATE INDEX "feedback_user_idx" ON "route_feedbacks" USING btree ("user_id");
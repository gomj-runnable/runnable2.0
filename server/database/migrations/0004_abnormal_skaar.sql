CREATE TABLE "route_likes" (
	"user_id" text NOT NULL,
	"route_id" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "route_likes_user_id_route_id_pk" PRIMARY KEY("user_id","route_id")
);
--> statement-breakpoint
ALTER TABLE "routes" ADD COLUMN "view_count" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "routes" ADD COLUMN "like_count" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "route_likes" ADD CONSTRAINT "route_likes_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "route_likes" ADD CONSTRAINT "route_likes_route_id_routes_route_id_fk" FOREIGN KEY ("route_id") REFERENCES "public"."routes"("route_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "route_like_count_idx" ON "routes" USING btree ("like_count");
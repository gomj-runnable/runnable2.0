CREATE TABLE "user_feature_prefs" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"plugin_id" text NOT NULL,
	"enabled" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "user_feature_prefs_user_plugin_uq" UNIQUE("user_id","plugin_id")
);
--> statement-breakpoint
ALTER TABLE "user_feature_prefs" ADD CONSTRAINT "user_feature_prefs_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
CREATE INDEX "user_feature_prefs_user_idx" ON "user_feature_prefs" USING btree ("user_id");

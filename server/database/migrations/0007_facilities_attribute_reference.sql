CREATE TABLE "crosswalk_attribute" (
	"facility_id" varchar(255) PRIMARY KEY NOT NULL,
	"has_signal" boolean
);
--> statement-breakpoint
CREATE TABLE "toilet_attribute" (
	"facility_id" varchar(255) PRIMARY KEY NOT NULL,
	"hours" text,
	"tel" text
);
--> statement-breakpoint
CREATE TABLE "hospital_attribute" (
	"facility_id" varchar(255) PRIMARY KEY NOT NULL,
	"hours" text,
	"tel" text
);
--> statement-breakpoint
CREATE TABLE "facility_reference" (
	"id" varchar(255) PRIMARY KEY NOT NULL,
	"facility_id" varchar(255) NOT NULL,
	"name" varchar(255) NOT NULL,
	"description" text NOT NULL,
	"url" text NOT NULL
);
--> statement-breakpoint
ALTER TABLE "crosswalk_attribute" ADD CONSTRAINT "crosswalk_attribute_facility_id_facilities_id_fk" FOREIGN KEY ("facility_id") REFERENCES "public"."facilities"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "toilet_attribute" ADD CONSTRAINT "toilet_attribute_facility_id_facilities_id_fk" FOREIGN KEY ("facility_id") REFERENCES "public"."facilities"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "hospital_attribute" ADD CONSTRAINT "hospital_attribute_facility_id_facilities_id_fk" FOREIGN KEY ("facility_id") REFERENCES "public"."facilities"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "facility_reference" ADD CONSTRAINT "facility_reference_facility_id_facilities_id_fk" FOREIGN KEY ("facility_id") REFERENCES "public"."facilities"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
CREATE INDEX "facility_reference_facility_idx" ON "facility_reference" USING btree ("facility_id");

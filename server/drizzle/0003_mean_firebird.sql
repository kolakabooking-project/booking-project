CREATE TABLE "room" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"lokasi" text NOT NULL,
	"kapasitas" integer DEFAULT 10 NOT NULL,
	"status" text DEFAULT 'Tersedia' NOT NULL,
	"foto" text,
	"deleted_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "room_booking" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"room_id" text NOT NULL,
	"start_time" timestamp NOT NULL,
	"end_time" timestamp NOT NULL,
	"keperluan" text NOT NULL,
	"jumlah_peserta" integer DEFAULT 1 NOT NULL,
	"status" text DEFAULT 'Disetujui' NOT NULL,
	"catatan" text,
	"alasan_pembatalan" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "room_booking_review" (
	"id" text PRIMARY KEY NOT NULL,
	"booking_id" text NOT NULL,
	"review_notes" text NOT NULL,
	"is_new" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "room_booking_review_booking_id_unique" UNIQUE("booking_id")
);
--> statement-breakpoint
ALTER TABLE "room_booking" ADD CONSTRAINT "room_booking_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "room_booking" ADD CONSTRAINT "room_booking_room_id_room_id_fk" FOREIGN KEY ("room_id") REFERENCES "public"."room"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "room_booking_review" ADD CONSTRAINT "room_booking_review_booking_id_room_booking_id_fk" FOREIGN KEY ("booking_id") REFERENCES "public"."room_booking"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "room_deleted_idx" ON "room" USING btree ("deleted_at");--> statement-breakpoint
CREATE INDEX "room_booking_user_idx" ON "room_booking" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "room_booking_room_idx" ON "room_booking" USING btree ("room_id");--> statement-breakpoint
CREATE INDEX "room_booking_status_idx" ON "room_booking" USING btree ("status");--> statement-breakpoint
CREATE INDEX "room_booking_time_range_idx" ON "room_booking" USING btree ("start_time","end_time");
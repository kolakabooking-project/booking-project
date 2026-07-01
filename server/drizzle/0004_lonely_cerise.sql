CREATE TABLE "jadwal_wfo" (
	"id" text PRIMARY KEY NOT NULL,
	"date" date NOT NULL,
	"user_id" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "notification" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"title" text NOT NULL,
	"body" text NOT NULL,
	"url" text,
	"is_read" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "jadwal_wfo" ADD CONSTRAINT "jadwal_wfo_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notification" ADD CONSTRAINT "notification_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "jadwal_wfo_date_idx" ON "jadwal_wfo" USING btree ("date");--> statement-breakpoint
CREATE INDEX "jadwal_wfo_user_idx" ON "jadwal_wfo" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "notification_user_idx" ON "notification" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "notification_created_at_idx" ON "notification" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "notification_user_is_read_idx" ON "notification" USING btree ("user_id","is_read");--> statement-breakpoint
CREATE INDEX "account_user_idx" ON "account" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "activity_log_action_created_idx" ON "activity_log" USING btree ("action","created_at");--> statement-breakpoint
CREATE INDEX "chat_msg_sender_created_idx" ON "chat_message" USING btree ("sender_id","created_at");--> statement-breakpoint
CREATE INDEX "chat_msg_receiver_created_idx" ON "chat_message" USING btree ("receiver_id","created_at");--> statement-breakpoint
CREATE INDEX "session_user_idx" ON "session" USING btree ("user_id");--> statement-breakpoint
ALTER TABLE "room" DROP COLUMN "kapasitas";
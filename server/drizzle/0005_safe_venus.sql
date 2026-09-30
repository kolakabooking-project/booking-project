CREATE TABLE "announcement_read" (
	"id" text PRIMARY KEY NOT NULL,
	"announcement_id" text NOT NULL,
	"user_id" text NOT NULL,
	"read_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "kegiatan_kepala" (
	"id" text PRIMARY KEY NOT NULL,
	"tanggal" date NOT NULL,
	"waktu_mulai" text NOT NULL,
	"waktu_selesai" text,
	"agenda" text NOT NULL,
	"tempat" text NOT NULL,
	"created_by" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "login_announcement" (
	"id" text PRIMARY KEY NOT NULL,
	"title" text NOT NULL,
	"content" text NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"priority" text DEFAULT 'info' NOT NULL,
	"target_role" text DEFAULT 'all' NOT NULL,
	"display_frequency" text DEFAULT 'always' NOT NULL,
	"start_date" timestamp,
	"end_date" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"created_by" text
);
--> statement-breakpoint
CREATE TABLE "st_kepala" (
	"id" text PRIMARY KEY NOT NULL,
	"tentang" text NOT NULL,
	"tempat" text NOT NULL,
	"tanggal" date NOT NULL,
	"tanggal_selesai" date,
	"created_by" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "nip_panjang" text;--> statement-breakpoint
ALTER TABLE "announcement_read" ADD CONSTRAINT "announcement_read_announcement_id_login_announcement_id_fk" FOREIGN KEY ("announcement_id") REFERENCES "public"."login_announcement"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "announcement_read" ADD CONSTRAINT "announcement_read_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "kegiatan_kepala" ADD CONSTRAINT "kegiatan_kepala_created_by_user_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "login_announcement" ADD CONSTRAINT "login_announcement_created_by_user_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "st_kepala" ADD CONSTRAINT "st_kepala_created_by_user_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "announcement_read_user_idx" ON "announcement_read" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "announcement_read_ann_user_idx" ON "announcement_read" USING btree ("announcement_id","user_id");--> statement-breakpoint
CREATE INDEX "kegiatan_kepala_tanggal_idx" ON "kegiatan_kepala" USING btree ("tanggal");--> statement-breakpoint
CREATE INDEX "kegiatan_kepala_created_by_idx" ON "kegiatan_kepala" USING btree ("created_by");--> statement-breakpoint
CREATE INDEX "login_announcement_active_idx" ON "login_announcement" USING btree ("is_active");--> statement-breakpoint
CREATE INDEX "login_announcement_role_idx" ON "login_announcement" USING btree ("target_role");--> statement-breakpoint
CREATE INDEX "login_announcement_created_idx" ON "login_announcement" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "st_kepala_tanggal_idx" ON "st_kepala" USING btree ("tanggal");--> statement-breakpoint
CREATE INDEX "st_kepala_created_by_idx" ON "st_kepala" USING btree ("created_by");
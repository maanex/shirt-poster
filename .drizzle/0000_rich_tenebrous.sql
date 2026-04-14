CREATE TABLE "config_kv" (
	"key" text NOT NULL,
	"guild" bigint,
	"value" text
);
--> statement-breakpoint
CREATE UNIQUE INDEX "config_kv_key_guild_uq" ON "config_kv" USING btree ("key","guild");--> statement-breakpoint
CREATE UNIQUE INDEX "config_kv_global_key_uq" ON "config_kv" USING btree ("key") WHERE "config_kv"."guild" is null;
CREATE TABLE "chess_ratings" (
	"timestamp" timestamp with time zone DEFAULT now() NOT NULL,
	"user_id" bigint NOT NULL,
	"chess_rating" text NOT NULL
);

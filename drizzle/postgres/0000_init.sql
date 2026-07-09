CREATE TABLE IF NOT EXISTS "user" (
  "id" text PRIMARY KEY,
  "name" text NOT NULL,
  "email" text NOT NULL UNIQUE,
  "email_verified" boolean NOT NULL DEFAULT false,
  "image" text,
  "created_at" timestamp NOT NULL DEFAULT now(),
  "updated_at" timestamp NOT NULL DEFAULT now(),
  "role" text,
  "banned" boolean DEFAULT false,
  "ban_reason" text,
  "ban_expires" timestamp
);

CREATE TABLE IF NOT EXISTS "session" (
  "id" text PRIMARY KEY,
  "expires_at" timestamp NOT NULL,
  "token" text NOT NULL UNIQUE,
  "created_at" timestamp NOT NULL DEFAULT now(),
  "updated_at" timestamp NOT NULL DEFAULT now(),
  "ip_address" text,
  "user_agent" text,
  "user_id" text NOT NULL REFERENCES "user"("id") ON DELETE CASCADE,
  "impersonated_by" text
);

CREATE INDEX IF NOT EXISTS "session_userId_idx" ON "session" ("user_id");

CREATE TABLE IF NOT EXISTS "account" (
  "id" text PRIMARY KEY,
  "account_id" text NOT NULL,
  "provider_id" text NOT NULL,
  "user_id" text NOT NULL REFERENCES "user"("id") ON DELETE CASCADE,
  "access_token" text,
  "refresh_token" text,
  "id_token" text,
  "access_token_expires_at" timestamp,
  "refresh_token_expires_at" timestamp,
  "scope" text,
  "password" text,
  "created_at" timestamp NOT NULL DEFAULT now(),
  "updated_at" timestamp NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS "account_userId_idx" ON "account" ("user_id");

CREATE TABLE IF NOT EXISTS "verification" (
  "id" text PRIMARY KEY,
  "identifier" text NOT NULL,
  "value" text NOT NULL,
  "expires_at" timestamp NOT NULL,
  "created_at" timestamp NOT NULL DEFAULT now(),
  "updated_at" timestamp NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS "verification_identifier_idx" ON "verification" ("identifier");

CREATE TABLE IF NOT EXISTS "rateLimit" (
  "id" text PRIMARY KEY,
  "key" text,
  "count" integer,
  "last_request" integer
);

CREATE INDEX IF NOT EXISTS "rateLimit_key_idx" ON "rateLimit" ("key");

CREATE TABLE IF NOT EXISTS "subscription" (
  "id" text PRIMARY KEY,
  "user_id" text NOT NULL UNIQUE REFERENCES "user"("id") ON DELETE CASCADE,
  "provider" text NOT NULL DEFAULT 'stripe',
  "customer_id" text NOT NULL,
  "subscription_id" text,
  "status" text NOT NULL DEFAULT 'none',
  "plan" text NOT NULL DEFAULT 'free',
  "price_id" text,
  "current_period_end" bigint,
  "cancel_at_period_end" boolean NOT NULL DEFAULT false,
  "lifetime" boolean NOT NULL DEFAULT false,
  "lifetime_payment_intent_id" text,
  "payment_failed_at" bigint,
  "last_event_at" bigint,
  "created_at" timestamp NOT NULL,
  "updated_at" timestamp NOT NULL
);

CREATE INDEX IF NOT EXISTS "subscription_customer_id_idx" ON "subscription" ("customer_id");

CREATE TABLE IF NOT EXISTS "processed_webhook_events" (
  "event_id" text PRIMARY KEY,
  "processed_at" timestamp NOT NULL,
  "status" text NOT NULL DEFAULT 'done'
);

CREATE TABLE IF NOT EXISTS "waitlist" (
  "id" text PRIMARY KEY,
  "email" text NOT NULL UNIQUE,
  "locale" text NOT NULL,
  "source" text NOT NULL DEFAULT 'waitlist',
  "created_at" timestamp NOT NULL
);

CREATE TABLE IF NOT EXISTS "feedback" (
  "id" text PRIMARY KEY,
  "user_id" text NOT NULL REFERENCES "user"("id") ON DELETE CASCADE,
  "title" text NOT NULL,
  "body" text NOT NULL DEFAULT '',
  "status" text NOT NULL DEFAULT 'open',
  "admin_note" text,
  "created_at" timestamp NOT NULL,
  "updated_at" timestamp NOT NULL
);

CREATE INDEX IF NOT EXISTS "feedback_userId_idx" ON "feedback" ("user_id");

CREATE TABLE IF NOT EXISTS "sponsorship" (
  "id" text PRIMARY KEY,
  "email" text,
  "github" text,
  "message" text,
  "amount" integer NOT NULL,
  "currency" text NOT NULL DEFAULT 'usd',
  "mode" text NOT NULL,
  "stripe_session_id" text NOT NULL UNIQUE,
  "stripe_subscription_id" text,
  "stripe_payment_intent_id" text,
  "status" text NOT NULL,
  "hidden" boolean NOT NULL DEFAULT false,
  "created_at" timestamp NOT NULL
);

CREATE INDEX IF NOT EXISTS "sponsorship_subscription_id_idx" ON "sponsorship" ("stripe_subscription_id");
CREATE INDEX IF NOT EXISTS "sponsorship_payment_intent_id_idx" ON "sponsorship" ("stripe_payment_intent_id");

CREATE TABLE IF NOT EXISTS "screenings" (
  "id" text PRIMARY KEY,
  "title" text NOT NULL,
  "date" text NOT NULL,
  "bilibili_bvid" text,
  "description" text NOT NULL,
  "status" text NOT NULL DEFAULT 'upcoming',
  "anime_title" text NOT NULL,
  "anime_cover" text NOT NULL,
  "created_at" timestamp NOT NULL
);

CREATE TABLE IF NOT EXISTS "screening_participants" (
  "id" text PRIMARY KEY,
  "group_id" text NOT NULL,
  "created_at" timestamp NOT NULL,
  "last_seen_at" timestamp NOT NULL
);

CREATE TABLE IF NOT EXISTS "screening_group_profiles" (
  "group_id" text PRIMARY KEY,
  "title" text NOT NULL,
  "subtitle" text NOT NULL,
  "image_key" text,
  "updated_at" timestamp NOT NULL
);

INSERT INTO "screening_group_profiles" ("group_id", "title", "subtitle", "image_key", "updated_at") VALUES
  ('group1', '船长一群', '稳健预测派', NULL, now()),
  ('group2', '船长二群', '锋利押宝派', NULL, now()),
  ('group3', '船长三群', '冷门奇袭派', NULL, now())
ON CONFLICT ("group_id") DO NOTHING;

CREATE TABLE IF NOT EXISTS "nominations" (
  "id" text PRIMARY KEY,
  "screening_id" text,
  "title" text NOT NULL,
  "normalized_title" text NOT NULL,
  "cover" text,
  "type" text NOT NULL DEFAULT 'anime',
  "nominated_by_id" text NOT NULL,
  "nominated_by_name" text NOT NULL,
  "reason" text NOT NULL,
  "status" text NOT NULL DEFAULT 'pending',
  "created_at" timestamp NOT NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS "nominations_normalized_title_unique" ON "nominations" ("normalized_title");
CREATE UNIQUE INDEX IF NOT EXISTS "nominations_nominated_by_id_unique" ON "nominations" ("nominated_by_id");
CREATE INDEX IF NOT EXISTS "nominations_type_idx" ON "nominations" ("type");

CREATE TABLE IF NOT EXISTS "votes" (
  "id" text PRIMARY KEY,
  "nomination_id" text NOT NULL,
  "user_id" text NOT NULL,
  "created_at" timestamp NOT NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS "votes_user_id_unique" ON "votes" ("user_id");
CREATE INDEX IF NOT EXISTS "votes_nomination_id_idx" ON "votes" ("nomination_id");

CREATE TABLE IF NOT EXISTS "reviews" (
  "id" text PRIMARY KEY,
  "screening_id" text NOT NULL,
  "user_id" text NOT NULL,
  "user_name" text NOT NULL,
  "rating" integer NOT NULL,
  "comment" text NOT NULL,
  "created_at" timestamp NOT NULL
);

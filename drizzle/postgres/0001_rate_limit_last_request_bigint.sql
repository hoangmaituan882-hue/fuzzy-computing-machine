ALTER TABLE "rateLimit"
  ALTER COLUMN "last_request" TYPE bigint
  USING "last_request"::bigint;

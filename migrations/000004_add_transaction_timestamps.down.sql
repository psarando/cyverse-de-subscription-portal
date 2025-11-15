BEGIN;

SET search_path = public, pg_catalog;

ALTER TABLE ONLY transaction_responses
    DROP COLUMN IF EXISTS transaction_date;

COMMIT;

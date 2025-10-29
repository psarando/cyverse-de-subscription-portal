BEGIN;

SET search_path = public, pg_catalog;

ALTER TABLE ONLY purchases
    ADD COLUMN IF NOT EXISTS customer_ip text;

COMMIT;

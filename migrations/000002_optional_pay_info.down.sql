BEGIN;

SET search_path = public, pg_catalog;

ALTER TABLE ONLY purchases
    ALTER COLUMN payment_id SET NOT NULL;
ALTER TABLE ONLY purchases
    ALTER COLUMN billing_information_id SET NOT NULL;

COMMIT;

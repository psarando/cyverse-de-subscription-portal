BEGIN;

SET search_path = public, pg_catalog;

-- We are no longer required to collect Payment and Billing Info,
-- so the data from these tables are optional now.
ALTER TABLE ONLY purchases
    ALTER COLUMN payment_id DROP NOT NULL;
ALTER TABLE ONLY purchases
    ALTER COLUMN billing_information_id DROP NOT NULL;

COMMIT;

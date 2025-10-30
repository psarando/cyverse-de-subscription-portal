BEGIN;

SET search_path = public, pg_catalog;

-- The customer's actual IP address was not populating correctly yet,
-- and now Authorize.net will store the actual IP in their order info.
ALTER TABLE ONLY purchases
    DROP COLUMN IF EXISTS customer_ip;

COMMIT;

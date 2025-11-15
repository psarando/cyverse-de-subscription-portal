BEGIN;

SET search_path = public, pg_catalog;

-- Adds a timestamp column to the `transaction_responses` table,
-- since a purchase can have more than one transaction response via callbacks.
ALTER TABLE ONLY transaction_responses
    ADD COLUMN IF NOT EXISTS transaction_date TIMESTAMPTZ NOT NULL DEFAULT now();

UPDATE transaction_responses SET transaction_date = (
    SELECT order_date FROM purchases WHERE purchases.id = purchase_id
);

COMMIT;

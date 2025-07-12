BEGIN;

SET search_path = public, pg_catalog;

DROP TABLE IF EXISTS purchased_subscription_addons;
DROP TABLE IF EXISTS purchased_subscriptions;
DROP TABLE IF EXISTS transaction_response_messages;
DROP TABLE IF EXISTS transaction_responses;
DROP TABLE IF EXISTS line_items;
DROP TABLE IF EXISTS purchases;
DROP TABLE IF EXISTS billing_information;
DROP TABLE IF EXISTS payments;
DROP SEQUENCE IF EXISTS purchase_order_numbers;

COMMIT;

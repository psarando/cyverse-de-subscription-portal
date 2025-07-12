BEGIN;

SET search_path = public, pg_catalog;

-- This sequence is used to generate purchase order numbers for users, which will act as a more human-friendly purchase
-- ID that users can refer to.
CREATE SEQUENCE IF NOT EXISTS purchase_order_numbers START 1;

-- This table contains the payment information for a purchase. We only support credit card payment at this time, so
-- that's the only type of payment supported by this table. The CVV code is required for purchases but it's not stored
-- for security purposes.
CREATE TABLE IF NOT EXISTS payments (
    id uuid NOT NULL DEFAULT uuid_generate_v1(),
    credit_card_number text NOT NULL,
    expiration_date date NOT NULL,
    PRIMARY KEY (id)
);

-- This table contains billing information for the purchasing user.
CREATE TABLE IF NOT EXISTS billing_information (
    id uuid NOT NULL DEFAULT uuid_generate_v1(),
    first_name text NOT NULL,
    last_name text NOT NULL,
    company text,
    address text NOT NULL,
    city text NOT NULL,
    state text NOT NULL,
    zip text NOT NULL,
    country text NOT NULL,
    PRIMARY KEY (id)
);

-- This table describes a single purchase. There can be multiple transactions for any given purchase if, for example,
-- one transaction fails and the user tries again. The ID is also added to the refId field in the transaction request
-- body.
CREATE TABLE IF NOT EXISTS purchases (
    id uuid NOT NULL DEFAULT uuid_generate_v1(),
    username text NOT NULL,
    amount money NOT NULL,
    payment_id uuid NOT NULL REFERENCES payments (id) ON DELETE CASCADE,
    poNumber text NOT NULL,
    billing_information_id uuid NOT NULL REFERENCES billing_information (id) ON DELETE CASCADE,
    customar_ip text NOT NULL,
    PRIMARY KEY (id)
);

-- This table contains line items for a purchase. The item_type column indicates whether the line item refers to a
-- subscription plan or an add-on (in case we need to programatically look up data in the QMS database later.) The
-- item_id column refers to the identifier of the add-on or subscription that is being purchased.
CREATE TABLE IF NOT EXISTS line_items (
    id uuid NOT NULL DEFAULT uuid_generate_v1(),
    purchase_id uuid NOT NULL REFERENCES purchases (id) ON DELETE CASCADE,
    item_type text NOT NULL,
    item_id uuid NOT NULL,
    item_name text NOT NULL,
    item_description text NOT NULL,
    quantity int NOT NULL,
    unit_price money NOT NULL,
    PRIMARY KEY (id)
);

-- This table contains information about a response to a transaction request.
CREATE TABLE IF NOT EXISTS transaction_responses (
    id uuid NOT NULL DEFAULT uuid_generate_v1(),
    purchase_id uuid NOT NULL REFERENCES purchases (id) ON DELETE CASCADE,
    response_code text NOT NULL,
    auth_code text NOT NULL,
    avsResultCode text,
    cvvResultCode text,
    cavvResultCode text,
    transaction_id text,
    ref_transaction_id text,
    test_request text,
    account_number text,
    account_type text,
    transaction_hash_sha2 text,
    supplemental_data_qualification_indicator int,
    network_transaction_id text,
    PRIMARY KEY (id)
);

-- This table contains detail messages from transaction responses.
CREATE TABLE IF NOT EXISTS transaction_response_messages (
    id uuid NOT NULL DEFAULT uuid_generate_v1(),
    transaction_response_id uuid NOT NULL REFERENCES transaction_responses (id) ON DELETE CASCADE,
    code text NOT NULL,
    description text NOT NULL,
    PRIMARY KEY (id)
);

-- This table references the subscriptions associated with a purchase.
CREATE TABLE IF NOT EXISTS purchased_subscriptions (
    id uuid NOT NULL DEFAULT uuid_generate_v1(),
    purchase_id uuid NOT NULL REFERENCES purchases (id) ON DELETE CASCADE,
    subscription_id uuid NOT NULL,
    PRIMARY KEY (id)
);

-- This table references the subscription add-ons associated with a purchase.
CREATE TABLE IF NOT EXISTS purchased_subscription_addons (
    id uuid NOT NULL DEFAULT uuid_generate_v1(),
    purchase_id uuid NOT NULL REFERENCES purchases (id) ON DELETE CASCADE,
    subscription_addon_id uuid NOT NULL,
    PRIMARY KEY (id)
);

COMMIT;

/**
 * @author psarando
 */
import logger from "@/logging";
import {
    CreateTransactionResponse,
    LineItemIDEnum,
    OrderDir,
    OrderRequest,
    PurchaseSortField,
} from "@/app/api/types";

import { UUID } from "crypto";
import getConfig from "next/config";
import { Client, QueryResult } from "pg";

const { serverRuntimeConfig } = getConfig();

const db = new Client({
    user: serverRuntimeConfig.dbUser,
    password: serverRuntimeConfig.dbPassword,
    host: serverRuntimeConfig.dbHost,
    port: serverRuntimeConfig.dbPort,
    database: serverRuntimeConfig.dbDatabase,
    connectionTimeoutMillis: serverRuntimeConfig.dbTimeout,
    statement_timeout: serverRuntimeConfig.dbTimeout,
    query_timeout: serverRuntimeConfig.dbTimeout,
    lock_timeout: serverRuntimeConfig.dbTimeout,
    idle_in_transaction_session_timeout: serverRuntimeConfig.dbTimeout,
});

await db.connect().catch((e) => {
    logger.error("Could not connect to database: %O", e);
});

// Represents a row in the "purchases" table.
type Purchase = {
    id: UUID;
    username: string;
    amount: string; // money, typically represented as a string
    payment_id: UUID;
    po_number: number;
    billing_information_id: UUID;
    order_date: Date; // timestampz, returned as JS Date
};

// Represents a row in the "payments" table.
type Payment = {
    id: UUID;
    credit_card_number: string; // char(4)
    expiration_date: Date; // date (YYYY-MM-DD), returned as JS Date
};

// Represents a row in the "billing_information" table.
type BillingInformation = {
    id: UUID;
    first_name: string;
    last_name: string;
    company?: string | null;
    address: string;
    city: string;
    state: string;
    zip: string;
    country: string;
};

// Represents a row in the "line_items" table.
type LineItem = {
    id: UUID;
    purchase_id: UUID;
    item_type: string;
    item_id: UUID;
    item_name: string;
    item_description: string;
    quantity: number;
    unit_price: string; // money, typically as string
};

// Represents a row in the "transaction_responses" table.
type TransactionResponse = {
    id: UUID;
    purchase_id: UUID;
    response_code: string;
    auth_code: string;
    avs_result_code?: string | null;
    cvv_result_code?: string | null;
    cavv_result_code?: string | null;
    transaction_id?: string | null;
    ref_transaction_id?: string | null;
    test_request?: string | null;
    account_number?: string | null;
    account_type?: string | null;
    transaction_hash_sha2?: string | null;
    supplemental_data_qualification_indicator?: number | null;
    network_transaction_id?: string | null;
};

// Represents a row in the "transaction_error_messages" table.
type TransactionErrorMessage = {
    id: UUID;
    transaction_response_id: UUID;
    error_code: string;
    error_text: string;
};

// Represents a row in the "transaction_response_messages" table.
type TransactionResponseMessage = {
    id: UUID;
    transaction_response_id: UUID;
    code: string;
    description: string;
};

// Represents a row in the "purchased_subscriptions" table.
type PurchasedSubscription = {
    id: UUID;
    purchase_id: UUID;
    subscription_id: UUID;
};

// Represents a row in the "purchased_subscription_addons" table.
type PurchasedSubscriptionAddon = {
    id: UUID;
    purchase_id: UUID;
    subscription_addon_id: UUID;
};

export async function healthCheck() {
    const { rows } = await db.query(
        "SELECT max(version) as current_version FROM schema_migrations WHERE dirty = false",
    );

    return rows ? rows[0]?.current_version : null;
}

/**
 * Adds the `transaction` to the database as a purchase order,
 * returning the `po_number`.
 */
export async function addPurchaseRecord(
    username: string,
    customerIP: string,
    order: OrderRequest,
) {
    let poNumber;
    let purchaseId;
    let orderDate;

    try {
        await db.query("BEGIN");

        const paymentId = await getOrAddPaymentId(
            username,
            order.payment.creditCard,
        );

        const billingInfoId = await getOrAddBillingInfoId(order.billTo);

        const { rows } = await db.query<Purchase>(
            `INSERT INTO purchases(
                username,
                amount,
                payment_id,
                po_number,
                billing_information_id,
                customer_ip
            )
            VALUES ($1, $2, $3, nextval('purchase_order_numbers'), $4, $5)
            RETURNING id, po_number, order_date`,
            [username, order.amount, paymentId, billingInfoId, customerIP],
        );

        if (rows && rows.length > 0) {
            purchaseId = rows[0].id;
            poNumber = rows[0].po_number;
            orderDate = rows[0].order_date;

            addLineItems(purchaseId, order.lineItems);
        }

        await db.query("COMMIT");
    } catch (e) {
        await db.query("ROLLBACK").catch((dbErr) => {
            logger.error("Could not rollback transaction: %O", dbErr);
        });

        logger.error("Could not add purchase order: %O", e);
    }

    return { poNumber, purchaseId, orderDate };
}

async function getOrAddPaymentId(
    username: string,
    creditCard: OrderRequest["payment"]["creditCard"],
) {
    const values = [
        creditCard.cardNumber.slice(-4),
        `${creditCard.expirationDate}-01`,
    ];

    const { rows: foundRows } = await db.query<Payment>(
        `SELECT DISTINCT payments.id AS id FROM payments
            JOIN purchases ON payment_id = payments.id
            WHERE credit_card_number = $1
            AND expiration_date = $2
            AND username = $3`,
        [...values, username],
    );

    if (foundRows && foundRows.length > 0) {
        return foundRows[0].id;
    }

    const { rows } = await db.query<Payment>(
        `INSERT INTO payments( credit_card_number, expiration_date )
        VALUES ($1, $2)
        RETURNING id`,
        values,
    );

    return rows ? rows[0].id : null;
}

async function getOrAddBillingInfoId(billTo: OrderRequest["billTo"]) {
    const values = [
        billTo.firstName,
        billTo.lastName,
        billTo.address,
        billTo.city,
        billTo.state,
        billTo.zip,
        billTo.country,
    ];

    const { rows: foundRows } = await db.query<BillingInformation>(
        `SELECT id FROM billing_information
            WHERE first_name = $1
            AND last_name = $2
            AND address = $3
            AND city = $4
            AND state = $5
            AND zip = $6
            AND country = $7`,
        values,
    );

    if (foundRows && foundRows.length > 0) {
        return foundRows[0].id;
    }

    const billToCols = [
        "first_name",
        "last_name",
        "address",
        "city",
        "state",
        "zip",
        "country",
    ];

    const billToValues = ["$1", "$2", "$3", "$4", "$5", "$6", "$7"];

    if (billTo.company) {
        values.push(billTo.company);
        billToCols.push("company");
        billToValues.push("$8");
    }

    const { rows } = await db.query<BillingInformation>(
        `INSERT INTO billing_information( ${billToCols.join(",")} )
        VALUES (${billToValues.join(",")})
        RETURNING id`,
        values,
    );

    return rows ? rows[0].id : null;
}

async function addLineItems(
    purchaseId: string,
    lineItems: OrderRequest["lineItems"],
) {
    if (!lineItems?.lineItem || lineItems.lineItem.length < 1) {
        return;
    }

    const lineItemPromises = lineItems.lineItem.map(
        ({ id, itemId, name, description, quantity, unitPrice }) =>
            db.query<LineItem>(
                `INSERT INTO line_items (
                    purchase_id,
                    item_type,
                    item_id,
                    item_name,
                    item_description,
                    quantity,
                    unit_price
                ) VALUES ($1, $2, $3, $4, $5, $6, $7)`,
                [
                    purchaseId,
                    itemId,
                    id,
                    name,
                    description ?? null,
                    quantity,
                    unitPrice,
                ],
            ),
    );

    const purchasedSubscriptionPromises: Promise<
        QueryResult<PurchasedSubscription | PurchasedSubscriptionAddon>
    >[] = [];

    lineItems.lineItem.forEach(({ id, itemId }) => {
        if (itemId === LineItemIDEnum.SUBSCRIPTION) {
            purchasedSubscriptionPromises.push(
                db.query<PurchasedSubscription>(
                    `INSERT INTO purchased_subscriptions (
                        purchase_id,
                        subscription_id
                    ) VALUES ($1, $2)`,
                    [purchaseId, id],
                ),
            );
        }

        if (itemId === LineItemIDEnum.ADDON) {
            purchasedSubscriptionPromises.push(
                db.query<PurchasedSubscriptionAddon>(
                    `INSERT INTO purchased_subscription_addons (
                        purchase_id,
                        subscription_addon_id
                    ) VALUES ($1, $2)`,
                    [purchaseId, id],
                ),
            );
        }
    });

    await Promise.all([...lineItemPromises, ...purchasedSubscriptionPromises]);
}

export async function addTransactionResponse(
    purchaseId: UUID,
    response: CreateTransactionResponse,
) {
    let responseId: UUID | undefined;

    try {
        const { transactionResponse, messages } = response;

        if (!transactionResponse) {
            logger.error(
                "No transactionResponse found in CreateTransactionResponse.",
            );
            return responseId;
        }

        const {
            responseCode,
            authCode,
            avsResultCode,
            cvvResultCode,
            cavvResultCode,
            transId,
            refTransID,
            testRequest,
            accountNumber,
            accountType,
            transHashSha2,
            SupplementalDataQualificationIndicator,
            networkTransId,
            errors,
        } = transactionResponse || {};

        const { rows } = await db.query<TransactionResponse>(
            `INSERT INTO transaction_responses (
                purchase_id,
                response_code,
                auth_code,
                avs_result_code,
                cvv_result_code,
                cavv_result_code,
                transaction_id,
                ref_transaction_id,
                test_request,
                account_number,
                account_type,
                transaction_hash_sha2,
                supplemental_data_qualification_indicator,
                network_transaction_id
            ) VALUES (
                $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14
            )
            RETURNING id`,
            [
                purchaseId,
                responseCode,
                authCode,
                avsResultCode ?? null,
                cvvResultCode ?? null,
                cavvResultCode ?? null,
                transId ?? null,
                refTransID ?? null,
                testRequest ?? null,
                accountNumber ?? null,
                accountType ?? null,
                transHashSha2 ?? null,
                SupplementalDataQualificationIndicator ?? null,
                networkTransId ?? null,
            ],
        );

        if (rows && rows.length > 0) {
            responseId = rows[0].id;

            if (errors && errors?.length > 0) {
                const insertPromises = errors.map(({ errorCode, errorText }) =>
                    db.query<TransactionErrorMessage>(
                        `INSERT INTO transaction_error_messages (
                            transaction_response_id,
                            error_code,
                            error_text
                        ) VALUES ($1, $2, $3)`,
                        [responseId, errorCode, errorText],
                    ),
                );

                await Promise.all(insertPromises);
            }

            if (messages && messages.message?.length > 0) {
                const insertPromises = messages.message.map(({ code, text }) =>
                    db.query<TransactionResponseMessage>(
                        `INSERT INTO transaction_response_messages (
                            transaction_response_id,
                            code,
                            description
                        ) VALUES ($1, $2, $3)`,
                        [responseId, code, text],
                    ),
                );

                await Promise.all(insertPromises);
            }
        }
    } catch (e) {
        logger.error("Error saving TransactionResponse to the database: %O", e);
    }

    return responseId;
}

export async function getPurchasesByUsername(
    username: string,
    orderField?: PurchaseSortField,
    orderDir?: OrderDir,
) {
    const { rows } = await db.query<Purchase>(
        `SELECT *
        FROM purchases
        WHERE username = $1
        ORDER BY ${orderField ?? PurchaseSortField.ORDER_DATE} ${orderDir ?? OrderDir.DESC}`,
        [username],
    );

    return rows;
}

import { TransactionRequest } from "@/app/api/types";
import { UUID } from "crypto";
import getConfig from "next/config";
import { Client } from "pg";

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

await db
    .connect()
    .catch((e) => console.error("Could not connect to database.", e));

// Represents a row in the "purchases" table.
type Purchase = {
    id: UUID;
    username: string;
    amount: string; // money, typically represented as a string
    payment_id: UUID;
    po_number: number;
    billing_information_id: UUID;
};

// Represents a row in the "payments" table.
type Payment = {
    id: UUID;
    credit_card_number: string; // char(4)
    expiration_date: string; // date, typically as ISO string (YYYY-MM-DD)
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

/**
 * Adds the `transaction` to the database as a purchase order,
 * returning the `po_number`.
 */
export async function addPurchaseRecord(
    username: string,
    customerIP: string,
    transaction: TransactionRequest,
) {
    let poNumber;
    let purchaseId;

    try {
        await db.query("BEGIN");

        const paymentId = await getOrAddPaymentId(
            username,
            transaction.payment.creditCard,
        );

        const billingInfoId = await getOrAddBillingInfoId(transaction.billTo);

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
            RETURNING id, po_number`,
            [
                username,
                transaction.amount,
                paymentId,
                billingInfoId,
                customerIP,
            ],
        );

        if (rows && rows.length > 0) {
            purchaseId = rows[0].id;
            poNumber = rows[0].po_number;

            addLineItems(purchaseId, transaction.lineItems);
        }

        await db.query("COMMIT");

        return poNumber;
    } catch (e) {
        await db
            .query("ROLLBACK")
            .catch((dbErr) =>
                console.error("Could not rollback transaction.", dbErr),
            );

        console.error("Could not add purchase order.", e);

        return null;
    }
}

async function getOrAddPaymentId(
    username: string,
    creditCard: TransactionRequest["payment"]["creditCard"],
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

async function getOrAddBillingInfoId(billTo: TransactionRequest["billTo"]) {
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
    lineItems: TransactionRequest["lineItems"],
) {
    if (!lineItems || lineItems?.length < 1) {
        return;
    }

    const insertPromises = lineItems.map(
        ({
            lineItem: { id, itemId, name, description, quantity, unitPrice },
        }) =>
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

    await Promise.all(insertPromises);
}

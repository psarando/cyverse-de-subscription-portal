/**
 * @author psarando
 */
import { auth } from "@/auth";
import {
    getBillingInfo,
    getLineItems,
    getPaymentInfo,
    getTransactionErrorMessages,
    getTransactionResponse,
    getTransactionResponseMessages,
    getUserPurchase,
} from "@/db";

import { NextResponse } from "next/server";

export async function GET(
    request: Request,
    { params }: { params: Promise<{ poNumber: string }> },
) {
    const session = await auth();
    const username = session?.user?.username;

    if (!username) {
        return NextResponse.json(
            { message: "Sign In Required" },
            { status: 401 },
        );
    }

    const { poNumber } = await params;

    const order = await getUserPurchase(username, parseInt(poNumber));

    if (!order) {
        return NextResponse.json(
            { message: "Order not found" },
            { status: 404 },
        );
    }

    const {
        id,
        po_number,
        amount,
        order_date,
        payment_id,
        billing_information_id,
    } = order;

    const payment = await getPaymentInfo(payment_id);
    const billing = await getBillingInfo(billing_information_id);
    const line_items = await getLineItems(id);
    const {
        id: transaction_response_id,
        transaction_id,
        account_number,
        account_type,
    } = (await getTransactionResponse(id)) || {};

    let response_messages;
    let error_messages;
    if (transaction_response_id) {
        response_messages = await getTransactionResponseMessages(
            transaction_response_id,
        );
        error_messages = await getTransactionErrorMessages(
            transaction_response_id,
        );
    }

    return NextResponse.json({
        po_number,
        amount,
        order_date,
        payment,
        billing,
        line_items,
        transaction_response: {
            transaction_id,
            account_number,
            account_type,
            response_messages,
            error_messages,
        },
    });
}

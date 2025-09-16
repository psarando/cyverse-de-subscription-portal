import { auth } from "@/auth";
import { addPurchaseRecord, addTransactionResponse } from "@/db";
import {
    CreateTransactionResponse,
    OrderError,
    OrderRequest,
    PlanType,
    SubscriptionSummaryDetails,
    TransactionRequest,
} from "@/app/api/types";
import {
    serviceAccountUpdateSubscription,
    terrainErrorResponse,
} from "@/app/api/terrain";
import { OrderRequestSchema } from "@/validation";

import { addDays, toDate } from "date-fns";
import { UUID } from "crypto";
import getConfig from "next/config";
import { NextRequest, NextResponse } from "next/server";
import { ValidationError } from "yup";

const { publicRuntimeConfig, serverRuntimeConfig } = getConfig();

export async function POST(request: NextRequest) {
    const {
        authorizeNetLoginId,
        authorizeNetTransactionKey,
        authorizeNetApiEndpoint,
    } = serverRuntimeConfig;
    const { terrainBaseUrl } = publicRuntimeConfig;

    if (!authorizeNetApiEndpoint) {
        return NextResponse.json(
            { message: "Authorize.net API Endpoint not configured." },
            { status: 500 },
        );
    }

    const session = await auth();
    const username = session?.user?.username;

    if (!username) {
        return NextResponse.json(
            { message: "Sign In Required" },
            { status: 401 },
        );
    }

    let transactionRequest: OrderRequest;
    const requestJson = (await request.json()) || {};

    try {
        transactionRequest = await OrderRequestSchema.validate(requestJson);
    } catch (e) {
        const validationError = e as ValidationError;

        console.error("Validation Error", e);

        return NextResponse.json(
            {
                error_code: "ERR_BAD_OR_MISSING_FIELD",
                message:
                    validationError.errors?.join("; ") ||
                    "Request Validation Error",
            },
            { status: 400 },
        );
    }

    const customerIP =
        request.headers.get("X-Forwarded-For")?.split(":")?.slice(-1)?.at(0) ||
        "0.0.0.0";

    // The Transaction Request fields must be strictly ordered,
    // since Authorize.net API endpoints convert JSON to XML internally.
    // Also, the schema's `validate` function may not keep the keys in order
    // if it needs to trim whitespace from string values.
    const {
        amount,
        currencyCode,
        payment: {
            creditCard: { cardNumber, expirationDate, cardCode },
        },
        lineItems,
        billTo: { firstName, lastName, company, address, city, state, zip },
    } = transactionRequest;

    const createTransactionRequest = {
        merchantAuthentication: {
            name: authorizeNetLoginId,
            transactionKey: authorizeNetTransactionKey,
        },
        transactionRequest: {
            transactionType: "authCaptureTransaction",
            amount,
            currencyCode,
            payment: { creditCard: { cardNumber, expirationDate, cardCode } },
            lineItems: lineItems?.map(
                ({
                    lineItem: {
                        itemId,
                        name,
                        description,
                        quantity,
                        unitPrice,
                    },
                }) => ({
                    lineItem: {
                        itemId,
                        name,
                        description,
                        quantity,
                        unitPrice,
                    },
                }),
            ),
            poNumber: 0, // placeholder
            billTo: { firstName, lastName, company, address, city, state, zip },
            customerIP,
        } as TransactionRequest,
    };

    const currentPricing: OrderError["currentPricing"] = { amount: 0 };

    const subscription = lineItems?.find(
        (item) => item.lineItem.itemId === "subscription",
    )?.lineItem;

    let currentSubscription: SubscriptionSummaryDetails | undefined;
    let orderSubscription: PlanType | undefined;
    if (subscription) {
        // Validate the user's subscription end date.
        const resourceUsageSummaryURL = "/resource-usage/summary";
        const resourceUsageSummaryResponse = await fetch(
            `${terrainBaseUrl}${resourceUsageSummaryURL}`,
            {
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${session?.accessToken}`,
                },
            },
        );

        if (!resourceUsageSummaryResponse.ok) {
            return terrainErrorResponse(
                resourceUsageSummaryURL,
                resourceUsageSummaryResponse,
            );
        }

        const resourceUsageSummary = await resourceUsageSummaryResponse.json();

        currentSubscription = resourceUsageSummary?.subscription;
        const endDate = currentSubscription?.effective_end_date;

        if (!endDate || toDate(endDate) > addDays(new Date(), 30)) {
            return NextResponse.json(
                {
                    error_code: "ERR_BAD_REQUEST",
                    message:
                        "You cannot renew your subscription more than 30 days before the end date.",
                },
                { status: 400 },
            );
        }

        // Validate the requested plan name and pricing.
        const plansUrl = "/qms/plans";
        const plansResponse = await fetch(`${terrainBaseUrl}${plansUrl}`, {
            headers: { "Content-Type": "application/json" },
        });

        if (!plansResponse.ok) {
            return terrainErrorResponse(plansUrl, plansResponse);
        }

        const plansData = await plansResponse.json();
        orderSubscription = plansData?.result?.find(
            (p: PlanType) => p.name === subscription.name,
        );

        if (!orderSubscription) {
            return NextResponse.json(
                {
                    error_code: "ERR_NOT_FOUND",
                    message: `Subscription plan "${subscription.name}" not found.`,
                },
                { status: 404 },
            );
        }

        // Update the line item's ID for the database,
        // not submitted to Authorize.net.
        subscription.id = orderSubscription.id;

        const rate = orderSubscription.plan_rates[0].rate;
        currentPricing.amount += rate * subscription.quantity;
        currentPricing.subscription = { name: subscription.name, rate };
    }

    if (amount !== currentPricing.amount) {
        return NextResponse.json(
            {
                error_code: "ERR_CONFLICT",
                message:
                    "Submitted order amount does not match current pricing.",
                currentPricing,
            },
            { status: 409 },
        );
    }

    // Save the purchase order in the database.
    const { poNumber, purchaseId } = await addPurchaseRecord(
        username,
        customerIP,
        transactionRequest,
    );

    if (!poNumber) {
        return NextResponse.json(
            { message: "Could not save purchase order in the database." },
            { status: 500 },
        );
    }

    createTransactionRequest.transactionRequest.poNumber = poNumber;

    // Submit the order payment.
    const authorizeResponse = await fetch(authorizeNetApiEndpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ createTransactionRequest }),
    });

    const status = authorizeResponse.status;
    const text = await authorizeResponse.text();

    let authorizeResponseJson: CreateTransactionResponse | undefined;
    try {
        authorizeResponseJson = JSON.parse(text);
    } catch {
        console.error("non-JSON response", {
            status,
            url: authorizeNetApiEndpoint,
            text,
        });
    }

    let responseJson: object = { poNumber, ...authorizeResponseJson };

    if (authorizeResponseJson) {
        addTransactionResponse(purchaseId as UUID, authorizeResponseJson);
    }

    // Check for payment errors.
    const transactionErrors =
        authorizeResponseJson?.transactionResponse?.errors;
    const transactionMessages = authorizeResponseJson?.messages;
    if (
        !authorizeResponse.ok ||
        transactionMessages?.resultCode === "Error" ||
        (transactionErrors && transactionErrors?.length > 0)
    ) {
        let errorMessage;

        if (transactionErrors && transactionErrors.length > 0) {
            errorMessage = transactionErrors;
        } else if (transactionMessages?.resultCode === "Error") {
            errorMessage = transactionMessages;
        }

        responseJson = {
            // Ensure there's a top-level `message` for the DEErrorDialog.
            message: errorMessage || authorizeResponse.statusText,
            ...responseJson,
        };

        return NextResponse.json(responseJson, {
            status: !authorizeResponse.ok && status ? status : 500,
        });
    }

    // The payment was successful, so update the user's subscription,
    // but only return a success response from here,
    // so the user knows their payment went through.
    if (subscription && currentSubscription) {
        const subscriptionUpdateResult = await serviceAccountUpdateSubscription(
            currentSubscription,
            subscription.name,
            subscription.quantity,
        );

        responseJson = {
            ...responseJson,
            ...subscriptionUpdateResult,
        };
    }

    return NextResponse.json(responseJson);
}

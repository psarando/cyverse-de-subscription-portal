import { auth } from "@/auth";
import {
    PlanType,
    SubscriptionSummaryDetails,
    TransactionRequest,
} from "@/app/api/serviceFacade";
import {
    serviceAccountUpdateSubscription,
    terrainErrorResponse,
} from "@/app/api/terrain";

import { addDays, toDate } from "date-fns";

import getConfig from "next/config";
import { NextRequest, NextResponse } from "next/server";

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

    const transactionRequest = await request.json();

    const { amount, currencyCode, payment, lineItems, billTo } =
        (transactionRequest || {}) as TransactionRequest;

    if (!amount || !currencyCode || !payment || !billTo) {
        const missing = [];
        if (!amount) missing.push("amount");
        if (!currencyCode) missing.push("currencyCode");
        if (!payment) missing.push("payment");
        if (!billTo) missing.push("billTo");

        return NextResponse.json(
            {
                error_code: "ERR_BAD_OR_MISSING_FIELD",
                message: `Missing required transaction fields: ${missing.join(", ")}`,
            },
            { status: 400 },
        );
    }

    // The Transaction Request fields must be strictly ordered,
    // since Authorize.net API endpoints convert JSON to XML internally.
    const createTransactionRequest = {
        createTransactionRequest: {
            merchantAuthentication: {
                name: authorizeNetLoginId,
                transactionKey: authorizeNetTransactionKey,
            },
            transactionRequest: {
                transactionType: "authCaptureTransaction",
                amount,
                currencyCode,
                payment,
                lineItems,
                billTo,
            },
        },
    };

    const currentPricing = { amount: 0 } as {
        amount: number;
        subscription?: { name: string; rate: number };
    };

    const subscription = lineItems?.find(
        (item) => item.lineItem.itemId === "subscription",
    )?.lineItem;

    let currentSubscription;
    if (subscription) {
        const session = await auth();
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

        currentSubscription =
            resourceUsageSummary?.subscription as SubscriptionSummaryDetails;
        const endDate = currentSubscription?.effective_end_date;

        if (!currentSubscription || toDate(endDate) > addDays(new Date(), 30)) {
            return NextResponse.json(
                {
                    error_code: "ERR_BAD_REQUEST",
                    message:
                        "You cannot renew your subscription more than 30 days before the end date.",
                },
                { status: 400 },
            );
        }

        const plansUrl = "/qms/plans";
        const plansResponse = await fetch(`${terrainBaseUrl}${plansUrl}`, {
            headers: { "Content-Type": "application/json" },
        });

        if (!plansResponse.ok) {
            return terrainErrorResponse(plansUrl, plansResponse);
        }

        const plansData = await plansResponse.json();
        const plan = plansData?.result?.find(
            (p: PlanType) => p.name === subscription.name,
        ) as PlanType | undefined;

        if (!plan) {
            return NextResponse.json(
                {
                    error_code: "ERR_NOT_FOUND",
                    message: `Subscription plan "${subscription.name}" not found.`,
                },
                { status: 404 },
            );
        }

        const rate = plan.plan_rates[0].rate;
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

    const authorizeResponse = await fetch(authorizeNetApiEndpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(createTransactionRequest),
    });

    const status = authorizeResponse.status;
    const text = await authorizeResponse.text();

    let responseJson;
    try {
        responseJson = JSON.parse(text);
    } catch {
        console.error("non-JSON response", {
            status,
            url: authorizeNetApiEndpoint,
            text,
        });
    }

    if (
        !authorizeResponse.ok ||
        responseJson?.messages?.resultCode === "Error" ||
        responseJson?.transactionResponse?.errors?.length > 0
    ) {
        let errorMessage;

        if (responseJson?.transactionResponse?.errors?.length > 0) {
            errorMessage = responseJson.transactionResponse.errors;
        } else if (responseJson?.messages?.resultCode === "Error") {
            errorMessage = responseJson?.messages;
        }

        if (errorMessage) {
            responseJson = {
                // Include a top-level message for the DEErrorDialog.
                message: errorMessage,
                ...responseJson,
            };
        }

        return NextResponse.json(
            responseJson || { message: authorizeResponse.statusText },
            {
                status: !authorizeResponse.ok && status ? status : 500,
            },
        );
    }

    if (subscription && currentSubscription) {
        const subscriptionUpdateResult = await serviceAccountUpdateSubscription(
            currentSubscription,
            subscription.name,
            subscription.quantity,
        );

        responseJson = { ...responseJson, ...subscriptionUpdateResult };
    }

    return NextResponse.json(responseJson);
}

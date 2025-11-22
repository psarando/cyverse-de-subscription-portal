import { auth } from "@/auth";
import constants from "@/constants";
import { addPurchaseRecord } from "@/db";
import logger from "@/logging";
import {
    AddonsList,
    GetHostedPaymentPageResponse,
    HostedPaymentSettings,
    LineItemIDEnum,
    OrderError,
    OrderRequest,
    OrderUpdateResult,
    PlanType,
    ResourceUsageSummary,
    TransactionRequest,
} from "@/app/api/types";
import {
    serviceAccountFetchAddons,
    terrainErrorResponse,
} from "@/app/api/terrain";
import CyVersePalette from "@/components/theme/CyVersePalette";
import { addonProratedRate } from "@/utils/rates";
import { OrderRequestSchema } from "@/validation";

import { differenceInCalendarDays } from "date-fns";
import getConfig from "next/config";
import { NextRequest, NextResponse } from "next/server";
import { ValidationError } from "yup";

const { publicRuntimeConfig, serverRuntimeConfig } = getConfig();

type HostedPaymentPageRequest = {
    merchantAuthentication: {
        name: string;
        transactionKey: string;
    };
    refId: string | number;
    transactionRequest: TransactionRequest;
    hostedPaymentSettings: HostedPaymentSettings;
};

export async function POST(request: NextRequest) {
    const {
        authorizeNetLoginId,
        authorizeNetTransactionKey,
        authorizeNetApiEndpoint,
    } = serverRuntimeConfig;
    const { subscriptionPortalBaseUrl, terrainBaseUrl } = publicRuntimeConfig;

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
    const user = session.user!;

    let orderRequest: OrderRequest;
    const requestJson = (await request.json()) || {};

    try {
        orderRequest = await OrderRequestSchema.validate(requestJson);
    } catch (e) {
        const validationError = e as ValidationError;

        logger.error("Validation Error: %O", e);

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

    const { amount, currencyCode, lineItems } = orderRequest;

    const currentPricing: OrderError["currentPricing"] = { amount: 0 };

    const subscription = lineItems?.lineItem?.find(
        (item) => item.itemId === LineItemIDEnum.SUBSCRIPTION,
    );

    const resourceUsageSummaryURL = "/resource-usage/summary";
    const resourceUsageSummaryResponse = await fetch(
        `${terrainBaseUrl}${resourceUsageSummaryURL}`,
        {
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${session.accessToken}`,
            },
        },
    );

    if (!resourceUsageSummaryResponse.ok) {
        return terrainErrorResponse(
            resourceUsageSummaryURL,
            resourceUsageSummaryResponse,
        );
    }

    const resourceUsageSummary: ResourceUsageSummary =
        await resourceUsageSummaryResponse.json();

    const currentSubscription = resourceUsageSummary?.subscription;
    const subscriptionEndDate = currentSubscription?.effective_end_date;

    let orderSubscription: PlanType | undefined;
    if (subscription) {
        // Validate the user's subscription end date.
        if (
            currentSubscription?.plan.name !== constants.PLAN_NAME_BASIC &&
            (!subscriptionEndDate ||
                differenceInCalendarDays(subscriptionEndDate, new Date()) > 30)
        ) {
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

    const addons = lineItems?.lineItem?.filter(
        (item) => item.itemId === LineItemIDEnum.ADDON,
    );

    if (addons && addons.length > 0) {
        // Validate the requested addons pricing.
        const addonsResponse = await serviceAccountFetchAddons();
        if (!addonsResponse.ok) {
            return addonsResponse;
        }

        const addonsData: AddonsList = await addonsResponse.json();
        if (!addonsData.addons || addonsData.addons.length === 0) {
            logger.error("Could not lookup addons current pricing: %o", {
                addonsData,
            });

            return NextResponse.json(
                {
                    error_code: "ERR_NOT_FOUND",
                    message: "Could not lookup addons current pricing.",
                },
                { status: 500 },
            );
        }

        for (const addon of addons) {
            currentPricing.amount +=
                addonProratedRate(
                    currentSubscription,
                    subscription?.quantity,
                    addonsData.addons.find((a) => a.uuid === addon.id),
                ) * addon.quantity;
        }
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
    const { poNumber, orderDate } = await addPurchaseRecord(
        username,
        orderRequest,
    );

    if (!poNumber) {
        return NextResponse.json(
            { message: "Could not save purchase order in the database." },
            { status: 500 },
        );
    }

    // The Transaction Request fields must be strictly ordered,
    // since Authorize.net API endpoints convert JSON to XML internally.
    // Also, the schema's `validate` function may not keep the keys in order
    // if it needs to trim whitespace from string values.
    const getHostedPaymentPageRequest: HostedPaymentPageRequest = {
        merchantAuthentication: {
            name: authorizeNetLoginId,
            transactionKey: authorizeNetTransactionKey,
        },
        refId: poNumber,
        transactionRequest: {
            transactionType: "authCaptureTransaction",
            amount,
            currencyCode,
            order: {
                description: lineItems?.lineItem
                    ?.map(
                        ({ itemId, name, quantity }) =>
                            `${quantity} x ${name} ${itemId}`,
                    )
                    .join(";\n"),
            },
            lineItems: {
                lineItem: lineItems?.lineItem?.map(
                    ({ itemId, name, description, quantity, unitPrice }) => ({
                        itemId,
                        name,
                        description,
                        quantity,
                        unitPrice,
                    }),
                ),
            },
            poNumber,
            customer: { email: user.email! },
            transactionSettings: {
                setting: [
                    {
                        settingName: "testRequest",
                        settingValue:
                            serverRuntimeConfig.authorizeNetTestRequests !==
                            "false",
                    },
                    {
                        settingName: "emailCustomer",
                        settingValue: "true",
                    },
                    {
                        settingName: "headerEmailReceipt",
                        settingValue:
                            "Thank you for your purchase with CyVerse! We greatly appreciate your business.",
                    },
                    {
                        settingName: "footerEmailReceipt",
                        settingValue:
                            "Please feel free to contact us at support@cyverse.org if you have any questions or encounter any problems.",
                    },
                ],
            },
        },
        hostedPaymentSettings: {
            setting: [
                {
                    settingName: "hostedPaymentReturnOptions",
                    settingValue: JSON.stringify({
                        showReceipt: true,
                        url: `${subscriptionPortalBaseUrl}/orders/${poNumber}`,
                        cancelUrl: subscriptionPortalBaseUrl,
                    }),
                },
                {
                    settingName: "hostedPaymentStyleOptions",
                    settingValue: JSON.stringify({
                        bgColor: CyVersePalette.cobalt,
                    }),
                },
                {
                    settingName: "hostedPaymentPaymentOptions",
                    settingValue: JSON.stringify({
                        cardCodeRequired: true,
                        showCreditCard: true,
                        showBankAccount: false,
                    }),
                },
                {
                    settingName: "hostedPaymentBillingAddressOptions",
                    settingValue: JSON.stringify({
                        required: true,
                    }),
                },
                {
                    settingName: "hostedPaymentOrderOptions",
                    settingValue: JSON.stringify({
                        show: true,
                        merchantName: "CyVerse",
                    }),
                },
            ],
        },
    };

    // Submit the order payment.
    const authorizeResponse = await fetch(authorizeNetApiEndpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ getHostedPaymentPageRequest }),
    });

    const status = authorizeResponse.status;
    const text = await authorizeResponse.text();

    let authorizeResponseJson: GetHostedPaymentPageResponse | undefined;
    try {
        authorizeResponseJson = JSON.parse(text);
    } catch {
        logger.error("non-JSON response: %o", {
            status,
            url: authorizeNetApiEndpoint,
            text,
        });
    }

    let responseJson: OrderUpdateResult = {
        poNumber,
        orderDate,
        ...authorizeResponseJson,
    };

    // Check for AuthzNet API errors.
    const transactionMessages = authorizeResponseJson?.messages;
    if (!authorizeResponse.ok || transactionMessages?.resultCode === "Error") {
        let errorMessage;

        if (transactionMessages?.resultCode === "Error") {
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

    return NextResponse.json(responseJson);
}

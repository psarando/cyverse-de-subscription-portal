/**
 * @author psarando
 */
import { addTransactionResponse, getPurchaseByPoNumber } from "@/db";
import logger from "@/logging";

import {
    serviceAccountEmailAdmin,
    serviceAccountEmailReceipt,
    serviceAccountFetchSubscription,
    serviceAccountUpdateAddons,
    serviceAccountUpdateSubscription,
} from "@/app/api/terrain";
import {
    CreateTransactionResponse,
    LineItemIDEnum,
    OrderDetails,
    TransactionResponseCodeEnum,
    UserSubscriptionListing,
} from "@/app/api/types";

import { createHmac } from "crypto";
import getConfig from "next/config";
import { NextRequest, NextResponse } from "next/server";

const { serverRuntimeConfig } = getConfig();

export async function POST(request: NextRequest) {
    const { authorizeNetSignatureKey } = serverRuntimeConfig;

    if (!authorizeNetSignatureKey) {
        return new NextResponse("Authorize.net Signature Key not configured.", {
            status: 500,
        });
    }

    const notification = await request.text();

    const hmac = createHmac("sha512", authorizeNetSignatureKey);
    hmac.update(notification);

    const signature = `sha512=${hmac.digest("hex")}`;
    if (request.headers.get("X-Anet-Signature")?.toLowerCase() !== signature) {
        return new NextResponse("Authorize.net Signature not verified.", {
            status: 401,
        });
    }

    let notificationJson;

    try {
        notificationJson = JSON.parse(notification);
    } catch {
        logger.error("Error parsing notification JSON: %o", {
            notification,
        });
        return new NextResponse("Error parsing notification JSON.", {
            status: 400,
        });
    }

    // Parse AuthzNet notification asynchronously so route can respond quickly.
    parseAuthorizeNotification(notificationJson);

    return new NextResponse("ok");
}

async function parseAuthorizeNotification(notificationJson?: {
    eventType?: string;
    eventDate?: string;
    payload?: CreateTransactionResponse["transactionResponse"] & {
        id: string; // Transaction ID
        merchantReferenceId: string; // PO Number
    };
}) {
    logger.debug("notificationJson: %O", notificationJson);

    if (
        notificationJson?.eventType !==
        "net.authorize.payment.authcapture.created"
    ) {
        logger.info(
            "Received unhandled Authorize.net notification type: %O",
            notificationJson,
        );
        return;
    }

    const { payload } = notificationJson;

    if (!payload?.merchantReferenceId) {
        logger.error(
            "Received Authorize.net notification without merchantReferenceId: %O",
            notificationJson,
        );
        return;
    }

    const purchase = await getPurchaseByPoNumber(
        parseInt(payload.merchantReferenceId),
    );

    if (purchase?.id) {
        const { id: purchaseId, username } = purchase;
        const transactionResponse = { ...payload, transId: payload.id };
        addTransactionResponse(purchaseId, {
            transactionResponse,
        });

        if (payload.responseCode === TransactionResponseCodeEnum.APPROVED) {
            const orderDetails = {
                ...purchase,
                transactionResponses: [
                    transactionResponse,
                    ...purchase.transactionResponses,
                ],
            };

            // The payment was successful, so update the user's subscription and addons.
            updateSubscription(username, orderDetails);
        } else {
            logger.debug("payment not approved %O", {
                purchaseId,
                username,
                payload,
            });
        }
    }
}

async function updateSubscription(
    username: string,
    orderDetails: OrderDetails,
) {
    const subscription = orderDetails.lineItems?.find(
        (item) => item.itemId === LineItemIDEnum.SUBSCRIPTION,
    );
    const addons = orderDetails.lineItems?.filter(
        (item) => item.itemId === LineItemIDEnum.ADDON,
    );

    if (!(subscription || addons)) {
        serviceAccountEmailAdmin(username, orderDetails);
        return;
    }

    const currentSubscriptionResponse =
        await serviceAccountFetchSubscription(username);

    const currentSubscriptions: UserSubscriptionListing =
        await currentSubscriptionResponse.json();

    const currentSubscription =
        currentSubscriptions?.result?.total > 0 &&
        currentSubscriptions.result.subscriptions[0];

    if (!currentSubscription) {
        serviceAccountEmailAdmin(username, orderDetails);
        return;
    }

    let subscriptionUpdateResult;
    if (subscription) {
        subscriptionUpdateResult = await serviceAccountUpdateSubscription(
            currentSubscription,
            subscription.name,
            subscription.quantity,
        );
    }

    let addonsUpdateResult;
    if (addons) {
        addonsUpdateResult = await serviceAccountUpdateAddons(
            currentSubscription.id,
            addons,
        );
    }

    serviceAccountEmailReceipt(
        username,
        orderDetails,
        subscriptionUpdateResult,
    );

    if (
        (subscriptionUpdateResult && !subscriptionUpdateResult.success) ||
        (addonsUpdateResult && !addonsUpdateResult.success)
    ) {
        serviceAccountEmailAdmin(
            username,
            orderDetails,
            subscriptionUpdateResult,
            addonsUpdateResult,
        );
    }
}

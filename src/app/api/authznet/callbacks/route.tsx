/**
 * @author psarando
 */
import constants from "@/constants";
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
import OrderDetailsPdf from "@/components/OrderDetailsPdf";

import { createHmac, timingSafeEqual } from "crypto";
import { NextRequest, NextResponse } from "next/server";

import { renderToBuffer } from "@react-pdf/renderer";

export async function POST(request: NextRequest) {
    const authorizeNetSignatureKey = process.env.SP_AUTHORIZE_NET_SIGNATURE_KEY;

    if (!authorizeNetSignatureKey) {
        return new NextResponse("Authorize.net Signature Key not configured.", {
            status: 500,
        });
    }

    const notification = await request.text();

    const hmac = createHmac("sha512", authorizeNetSignatureKey);
    hmac.update(notification);

    const signature = `sha512=${hmac.digest("hex")}`;
    const anetSignature = request.headers
        .get("X-Anet-Signature")
        ?.toLowerCase();
    if (
        !anetSignature ||
        anetSignature.length !== signature.length ||
        !timingSafeEqual(Buffer.from(anetSignature), Buffer.from(signature))
    ) {
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
    logger.debug("request.nextUrl.href: '%s'", request.nextUrl.href);
    logger.debug("request.nextUrl.host: '%s'", request.nextUrl.host);

    logger.debug("/api/authznet/callbacks OK");

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
    logger.debug("notificationJson: %o", notificationJson);

    if (!notificationJson?.eventType?.startsWith("net.authorize.payment.")) {
        logger.info(
            "Received unhandled Authorize.net notification type: %O",
            notificationJson,
        );
        return;
    }

    const { eventType, eventDate, payload } = notificationJson;

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

    if (!purchase?.id) {
        logger.error(
            "Could not lookup purchase by PO Number '%s': %O",
            payload.merchantReferenceId,
            purchase,
        );
        return;
    }

    const { id: purchaseId, username } = purchase;
    const transactionResponse = {
        transId: payload.id,
        transDate: eventDate,
        avsResultCode: payload.avsResponse,
        ...payload,
    };
    addTransactionResponse(purchaseId, { transactionResponse });

    if (payload.responseCode !== TransactionResponseCodeEnum.APPROVED) {
        logger.info("payment not approved %o", {
            purchaseId,
            username,
            payload,
        });
        return;
    }

    if (
        ![
            "net.authorize.payment.authcapture.created",
            "net.authorize.payment.fraud.approved",
        ].includes(eventType)
    ) {
        logger.warn("APPROVED payment for unexpected eventType %o", {
            purchaseId,
            username,
            eventType,
            payload,
        });
    }

    const orderDetails = {
        ...purchase,
        transactionResponses: [
            transactionResponse,
            ...purchase.transactionResponses,
        ],
    };

    // The payment was successful, so update the user's subscription and addons.
    updateSubscription(username, orderDetails);
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
        currentSubscriptionResponse.ok &&
        currentSubscriptions?.result?.total > 0 &&
        currentSubscriptions.result.subscriptions[0];

    if (!currentSubscriptionResponse.ok || !currentSubscription) {
        logger.error(
            "Could not fetch user's current subscription: %o",
            currentSubscriptions,
        );
        serviceAccountEmailAdmin(username, orderDetails);
        return;
    }

    let addonSubscriptionId = currentSubscription.id;

    let subscriptionUpdateResult;
    if (subscription) {
        subscriptionUpdateResult = await serviceAccountUpdateSubscription(
            currentSubscription,
            subscription.name,
            subscription.quantity,
        );

        if (currentSubscription.plan.name === constants.PLAN_NAME_BASIC) {
            addonSubscriptionId = subscriptionUpdateResult?.result?.id;
        }
    }

    let addonsUpdateResult;
    if (addons && addonSubscriptionId) {
        addonsUpdateResult = await serviceAccountUpdateAddons(
            addonSubscriptionId,
            addons,
        );
    }

    let receiptPDF;
    try {
        receiptPDF = await renderToBuffer(
            <OrderDetailsPdf order={orderDetails} />,
        );
    } catch (e) {
        logger.error(
            "Could not generate PDF receipt for order %O\n%O",
            orderDetails,
            e,
        );
    }

    serviceAccountEmailReceipt(
        username,
        orderDetails,
        subscriptionUpdateResult,
        receiptPDF?.toString("base64"),
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

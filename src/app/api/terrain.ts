import { auth } from "@/auth";
import constants from "@/constants";
import logger from "@/logging";
import { dateConstants, formatDate, formatQuota } from "@/utils/formatUtils";

import {
    AddonsUpdateResult,
    LineItemIDEnum,
    OrderDetails,
    Subscription,
    SubscriptionUpdateResult,
} from "./types";

import { addSeconds, toDate } from "date-fns";

import getConfig from "next/config";
import { NextResponse } from "next/server";

type KeyCloakToken = {
    access_token: string;
    expires_in: number;
    accessTokenExp?: Date;
};

const { publicRuntimeConfig, serverRuntimeConfig } = getConfig();

// FIXME: store this in the DB.
let serviceAccountToken: KeyCloakToken | null = null;

export async function parseErrorJson(response: Response, url: string) {
    const text = await response.text();

    let errorJson;
    try {
        errorJson = JSON.parse(text);
    } catch {
        logger.error("non-JSON error response: %o", {
            status: response.status,
            url,
            text,
        });
    }

    return errorJson;
}

export async function terrainErrorResponse(url: string, response: Response) {
    const errorJson = await parseErrorJson(response, url);

    return NextResponse.json(errorJson || { message: response.statusText }, {
        status: response.status || 500,
    });
}

export async function callTerrain(
    method: string,
    url: string,
    body?: BodyInit,
) {
    const { terrainBaseUrl } = publicRuntimeConfig;
    if (!terrainBaseUrl) {
        return NextResponse.json(
            { message: "Terrain Base URL not configured." },
            { status: 500 },
        );
    }

    const session = await auth();

    const response = await fetch(`${terrainBaseUrl}${url}`, {
        method,
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session?.accessToken}`,
        },
        body,
    });

    if (!response.ok) {
        return terrainErrorResponse(url, response);
    }

    const data = await response.json();
    return NextResponse.json(data);
}

async function getServiceAccountToken() {
    if (
        !serviceAccountToken ||
        !serviceAccountToken.accessTokenExp ||
        serviceAccountToken.accessTokenExp < new Date()
    ) {
        serviceAccountToken = null;

        const tokenUrl = `${serverRuntimeConfig.keycloakIssuer}/protocol/openid-connect/token`;
        const credBuffer = Buffer.from(
            [
                serverRuntimeConfig.keycloakClientId,
                serverRuntimeConfig.keycloakClientSecret,
            ].join(":"),
        );

        const tokenResponse = await fetch(tokenUrl, {
            method: "POST",
            headers: {
                "Content-Type": "application/x-www-form-urlencoded",
                Authorization: `Basic ${credBuffer.toString("base64")}`,
            },
            body: "grant_type=client_credentials",
        });

        if (tokenResponse.ok) {
            const tokenData = await tokenResponse.json();
            serviceAccountToken = tokenData;
        } else {
            const errorJson = await parseErrorJson(tokenResponse, tokenUrl);

            logger.error("Could not get service account token: %o", {
                errorJson,
            });
        }

        if (serviceAccountToken) {
            serviceAccountToken.accessTokenExp = addSeconds(
                new Date(),
                serviceAccountToken.expires_in,
            );
        }
    }

    return serviceAccountToken?.access_token;
}

async function serviceAccountCallTerrain(
    method: string,
    url: string,
    body?: BodyInit,
) {
    const { terrainBaseUrl } = publicRuntimeConfig;

    const token = await getServiceAccountToken();
    if (!token) {
        return NextResponse.json(
            { message: "Could not get service account token." },
            {
                status: 500,
            },
        );
    }

    const response = await fetch(`${terrainBaseUrl}${url}`, {
        method,
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
        },
        body,
    });

    if (!response.ok) {
        return terrainErrorResponse(url, response);
    }

    return response;
}

export async function serviceAccountFetchSubscription(username: string) {
    const url = `/service/qms/users/${username}/subscriptions`;
    const response = await serviceAccountCallTerrain("GET", url);

    if (!response.ok) {
        return terrainErrorResponse(url, response);
    }

    return response;
}

export async function serviceAccountUpdateSubscription(
    currentSubscription: Subscription,
    plan_name: string,
    periods: number,
) {
    const today = new Date();
    const currentEndDate = toDate(currentSubscription.effective_end_date);
    const newStartDate =
        currentSubscription.plan.name !== constants.PLAN_NAME_BASIC &&
        currentEndDate > today
            ? currentEndDate
            : today;

    const queryParams = new URLSearchParams({
        periods: periods.toString(),
        "start-date": formatDate(newStartDate, dateConstants.DATE_FORMAT),
        paid: "true",
    });

    const {
        user: { username },
    } = currentSubscription;

    const method = "PUT";
    const url = `/service/qms/users/${username}/plan/${plan_name}?${queryParams}`;

    const response = await serviceAccountCallTerrain(method, url);

    if (!response.ok) {
        const error = await parseErrorJson(response, url);

        logger.error("Could not update user subscription: %o", { error });

        return {
            success: false,
            error: {
                message: "Could not update user subscription.",
                method,
                url,
                status: response.status,
                response: error,
            },
        };
    }

    const data = await response.json();

    return { success: true, ...data };
}

export async function serviceAccountFetchAddons() {
    const url = "/service/qms/addons";
    const response = await serviceAccountCallTerrain("GET", url);

    if (!response.ok) {
        return terrainErrorResponse(url, response);
    }

    return response;
}

export async function serviceAccountUpdateAddons(
    subscriptionId: string,
    addons: Array<{ qmsId: string; quantity: number }>,
) {
    let success = true;
    const addonsResults = [];

    const method = "POST";
    const url = `/service/qms/subscriptions/${subscriptionId}/addons`;

    for (const addon of addons) {
        for (let i = 0; i < addon.quantity; i++) {
            const response = await serviceAccountCallTerrain(
                method,
                url,
                JSON.stringify({ uuid: addon.qmsId }),
            );

            if (response.ok) {
                const data = await response.json();
                addonsResults.push(data);
            } else {
                success = false;

                const error = await parseErrorJson(response, url);

                logger.error("Could not update user subscription addon: %o", {
                    error,
                });

                addonsResults.push({
                    success: false,
                    error: {
                        message: "Could not update user subscription.",
                        method,
                        url,
                        status: response.status,
                        response: error,
                    },
                });
            }
        }
    }

    return { success, addons: addonsResults } as AddonsUpdateResult;
}

export async function serviceAccountFetchUserInfo(username: string) {
    const url = `/service/users/${username}`;
    const response = await serviceAccountCallTerrain("GET", url);

    if (!response.ok) {
        const errorJson = await parseErrorJson(response, url);
        logger.error("serviceAccountFetchUserInfo Error: %O", errorJson);

        return null;
    }

    return await response.json();
}

export async function serviceAccountEmailReceipt(
    username: string,
    orderDetails: OrderDetails,
    subscription?: SubscriptionUpdateResult,
    receiptPDF?: string,
) {
    const { poNumber, orderDate, amount, transactionResponses, lineItems } =
        orderDetails;
    const transactionResponse = transactionResponses && transactionResponses[0];
    const orderedSubscription = lineItems?.find(
        (item) => item.itemId === LineItemIDEnum.SUBSCRIPTION,
    );

    const userInfo = await serviceAccountFetchUserInfo(username);
    const { common_name, first_name, last_name, email } = userInfo || {};

    if (!email) {
        logger.error(
            "Could not lookup email address for '%s': %O",
            username,
            userInfo,
        );
        return;
    }

    const values = {
        user: common_name
            ? common_name
            : first_name || last_name
              ? `${first_name} ${last_name}`
              : username,
        Amount: amount,
        PoNumber: poNumber,
        PurchaseTime: formatDate(
            new Date(orderDate as Date),
            dateConstants.ISO_8601,
        ),
        TransactionId: transactionResponse?.transId,
        SubscriptionLevel:
            subscription?.result?.plan.name ?? orderedSubscription?.name,
        SubscriptionPeriod:
            orderedSubscription?.quantity === 1 ? "1 Year" : "2 Years",
        SubscriptionPrice: orderedSubscription?.unitPrice,
        SubscriptionStartDate: subscription?.result?.effective_start_date
            ? formatDate(
                  new Date(subscription.result.effective_start_date),
                  dateConstants.DATE_FORMAT,
              )
            : undefined,
        SubscriptionEndDate: subscription?.result?.effective_end_date
            ? formatDate(
                  new Date(subscription.result.effective_end_date),
                  dateConstants.DATE_FORMAT,
              )
            : undefined,
        SubscriptionQuotas: subscription?.result?.quotas.map((item) =>
            formatQuota(item.quota, item.resource_type.unit),
        ),
        Addons: lineItems
            ?.filter((item) => item.itemId === LineItemIDEnum.ADDON)
            ?.map((addon) => ({
                Name: addon.name,
                Quantity: addon.quantity,
                Price: addon.unitPrice,
            })),
    };

    const subject = `CyVerse Subscription Order #${poNumber}`;
    const body = {
        from_addr: serverRuntimeConfig.supportEmail,
        from_name: "CyVerse Subscription Portal",
        subject,
        template: "subscription_purchase_complete",
        attachments: receiptPDF
            ? [{ filename: `${subject}.pdf`, data: receiptPDF }]
            : undefined,
        values,
    };

    serviceAccountSendEmail({
        ...body,
        to: email,
        bcc: [serverRuntimeConfig.supportEmail],
    });
}

export async function serviceAccountEmailAdmin(
    username: string,
    orderDetails: OrderDetails,
    subscriptionUpdateResult?: SubscriptionUpdateResult,
    addonsUpdateResult?: AddonsUpdateResult,
) {
    serviceAccountSendEmail({
        from_addr: serverRuntimeConfig.supportEmail,
        from_name: "CyVerse Subscription Portal",
        to: serverRuntimeConfig.supportEmail,
        subject: `CyVerse Subscription Order #${orderDetails.poNumber}`,
        template: "subscription_purchase_admin_required",
        values: {
            PurchaseTime: formatDate(
                new Date(orderDetails.orderDate as Date),
                dateConstants.ISO_8601,
            ),
            SubscriptionDetails: JSON.stringify(
                {
                    username,
                    orderDetails,
                    subscriptionUpdateResult,
                    addonsUpdateResult,
                },
                null,
                2,
            ),
        },
    });
}

async function serviceAccountSendEmail(body: object) {
    const url = "/service/email";

    serviceAccountCallTerrain("POST", url, JSON.stringify(body))
        .then((response) => {
            if (!response.ok) {
                parseErrorJson(response, url).then((error) => {
                    logger.error("Could not send order receipt email.");
                    logger.error("%o", { body });
                    logger.error("%O", error);
                });
            }
        })
        .catch((error) => {
            logger.error("Could not send order receipt email.");
            logger.error("%o", { body });
            logger.error("%O", error);
        });
}

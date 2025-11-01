import { auth } from "@/auth";
import constants from "@/constants";
import logger from "@/logging";
import {
    dateConstants,
    formatCurrency,
    formatDate,
    formatQuota,
} from "@/utils/formatUtils";

import {
    AddonsUpdateResult,
    LineItemIDEnum,
    OrderRequest,
    OrderUpdateResult,
    SubscriptionSummaryDetails,
    SubscriptionUpdateResult,
} from "./types";

import { addSeconds, toDate } from "date-fns";
import { Session } from "next-auth";

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

export async function serviceAccountUpdateSubscription(
    currentSubscription: SubscriptionSummaryDetails,
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
        users: { username },
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

    return { success: true, subscription: data };
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
    addons: Array<{ id?: string; quantity: number }>,
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
                JSON.stringify({ uuid: addon.id }),
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

    return { success, addons: addonsResults };
}

export async function serviceAccountEmailReceipt(
    user: Session["user"],
    orderRequest: OrderRequest,
    { poNumber, orderDate, transactionResponse, error }: OrderUpdateResult,
    success: boolean,
    subscription: SubscriptionUpdateResult,
    addons: AddonsUpdateResult,
) {
    const { username, name, email } = user!;
    const { amount, lineItems } = orderRequest;
    const orderedSubscription = orderRequest.lineItems?.lineItem?.find(
        (item) => item.itemId === LineItemIDEnum.SUBSCRIPTION,
    );

    const values = {
        user: name || username,
        Amount: formatCurrency(amount),
        PoNumber: poNumber,
        PurchaseTime: formatDate(
            new Date(orderDate as Date),
            dateConstants.ISO_8601,
        ),
        TransactionId: transactionResponse?.transId,
        SubscriptionLevel:
            subscription?.result.plan.name ?? orderedSubscription?.name,
        SubscriptionPeriod:
            orderedSubscription?.quantity === 1 ? "1 Year" : "2 Years",
        SubscriptionPrice: formatCurrency(orderedSubscription?.unitPrice),
        SubscriptionStartDate: subscription
            ? formatDate(
                  new Date(subscription.result.effective_start_date),
                  dateConstants.DATE_FORMAT,
              )
            : undefined,
        SubscriptionEndDate: subscription
            ? formatDate(
                  new Date(subscription.result.effective_end_date),
                  dateConstants.DATE_FORMAT,
              )
            : undefined,
        SubscriptionQuotas: subscription?.result.quotas.map((item) =>
            formatQuota(item.quota, item.resource_type.unit),
        ),
        Addons: orderRequest.lineItems?.lineItem
            ?.filter((item) => item.itemId === LineItemIDEnum.ADDON)
            ?.map((addon) => ({
                Name: addon.name,
                Quantity: addon.quantity,
                Price: formatCurrency(addon.unitPrice),
            })),
    };

    const body = {
        from_addr: serverRuntimeConfig.supportEmail,
        from_name: "CyVerse Subscription Portal",
        subject: `CyVerse Subscription Order #${poNumber}`,
        template: "subscription_purchase_complete",
        values,
    };

    serviceAccountSendEmail({
        ...body,
        to: email,
        bcc: [serverRuntimeConfig.supportEmail],
    });

    if (!success) {
        serviceAccountSendEmail({
            ...body,
            to: serverRuntimeConfig.supportEmail,
            template: "subscription_purchase_admin_required",
            values: {
                ...values,
                SubscriptionDetails: JSON.stringify(
                    {
                        username,
                        poNumber,
                        transactionId: transactionResponse?.transId,
                        lineItems,
                        error,
                        subscription,
                        addons,
                    },
                    null,
                    2,
                ),
            },
        });
    }
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

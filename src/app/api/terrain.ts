import { auth } from "@/auth";
import constants from "@/constants";
import {
    dateConstants,
    formatCurrency,
    formatDate,
    formatQuota,
} from "@/utils/formatUtils";

import {
    LineItemIDEnum,
    OrderRequest,
    OrderUpdateResult,
    SubscriptionSummaryDetails,
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
        console.error("non-JSON error response", {
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

export async function getServiceAccountToken() {
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

            console.error("Could not get service account token.", {
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

export async function serviceAccountCallTerrain(
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

        console.error("Could not update user subscription.", { error });

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

                console.error("Could not update user subscription addon.", {
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
    username: string,
    email: string,
    orderRequest: OrderRequest,
    {
        success,
        poNumber,
        orderDate,
        transactionResponse,
        subscription,
        addons,
    }: OrderUpdateResult,
) {
    const { amount, lineItems, billTo } = orderRequest;
    const orderedSubscription = orderRequest.lineItems?.lineItem?.find(
        (item) => item.itemId === LineItemIDEnum.SUBSCRIPTION,
    );

    const values = {
        Amount: formatCurrency(amount),
        PoNumber: poNumber,
        PurchaseTime: formatDate(
            new Date(orderDate as Date),
            dateConstants.ISO_8601,
        ),
        TransactionId: transactionResponse?.transId,
        BillToName: `${billTo.firstName} ${billTo.lastName}`,
        BillToCompany: billTo.company,
        BillToAddress: [
            billTo.address,
            billTo.city,
            billTo.state,
            billTo.zip,
            billTo.country,
        ].join(", "),
        CardType: transactionResponse?.accountType,
        CardNumberEnding: transactionResponse?.accountNumber,
        CardExpiration: orderRequest.payment.creditCard.expirationDate,
        SubscriptionLevel: subscription?.result.plan.name,
        SubscriptionPeriod:
            orderedSubscription?.quantity === 1 ? "1 Year" : "2 Years",
        SubscriptionPrice: formatCurrency(orderedSubscription?.unitPrice),
        SubscriptionStartDate: subscription
            ? formatDate(
                  subscription.result.effective_start_date,
                  dateConstants.DATE_FORMAT,
              )
            : undefined,
        SubscriptionEndDate: subscription
            ? formatDate(
                  subscription.result.effective_end_date,
                  dateConstants.DATE_FORMAT,
              )
            : undefined,
        SubscriptionQuotas: subscription?.result.quotas.map((item) =>
            formatQuota(item.quota, item.resource_type.unit),
        ),
        Addons: addons?.map((addon) => {
            const orderedAddon = orderRequest.lineItems?.lineItem?.find(
                (item) => item.id === addon.subscription_addon?.uuid,
            );
            return {
                Name: addon.subscription_addon?.addon.name,
                Quantity: orderedAddon?.quantity,
                Price: formatCurrency(orderedAddon?.unitPrice),
            };
        }),
    };

    const body = {
        from_addr: "support@cyverse.org",
        from_name: "CyVerse Subscription Portal",
        subject: `CyVerse Subscription Order #${poNumber}`,
        template: "subscription_purchase_complete",
        values,
    };

    serviceAccountSendEmail({ ...body, to: email });

    if (success) {
        serviceAccountSendEmail({
            ...body,
            to: serverRuntimeConfig.supportEmail,
        });
    } else {
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
                parseErrorJson(response, url).then((error) =>
                    console.error(
                        "Could not send order receipt email.",
                        JSON.stringify({ body }),
                        JSON.stringify({ error }),
                    ),
                );
            }
        })
        .catch((error) => {
            console.error(
                "Could not send order receipt email.",
                JSON.stringify({ body }),
                error,
            );
        });
}

import { auth } from "@/auth";
import { dateConstants, formatDate } from "@/utils/formatUtils";

import { SubscriptionSummaryDetails } from "./types";

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

        if (!tokenResponse.ok) {
            const errorJson = await parseErrorJson(tokenResponse, tokenUrl);

            console.error("Could not get service account token.", {
                errorJson,
            });
        }

        const tokenData = await tokenResponse.json();
        serviceAccountToken = tokenData;

        if (serviceAccountToken) {
            serviceAccountToken.accessTokenExp = addSeconds(
                new Date(),
                serviceAccountToken.expires_in,
            );
        } else {
            console.error("Could not get service account token.", {
                tokenData,
            });
        }
    }

    return serviceAccountToken?.access_token;
}

export async function serviceAccountUpdateSubscription(
    currentSubscription: SubscriptionSummaryDetails,
    plan_name: string,
    periods: number,
) {
    const { terrainBaseUrl } = publicRuntimeConfig;

    const token = await getServiceAccountToken();
    if (!token) {
        return {
            success: false,
            error: { message: "Could not get service account token." },
        };
    }

    const today = new Date();
    const currentEndDate = toDate(currentSubscription.effective_end_date);
    const newStartDate = currentEndDate > today ? currentEndDate : today;

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

    const response = await fetch(`${terrainBaseUrl}${url}`, {
        method,
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
        },
    });

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

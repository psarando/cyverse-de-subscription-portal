import getConfig from "next/config";
import { NextRequest, NextResponse } from "next/server";

const { serverRuntimeConfig } = getConfig();

export async function POST(request: NextRequest) {
    const {
        authorizeNetLoginId,
        authorizeNetTransactionKey,
        authorizeNetApiEndpoint,
    } = serverRuntimeConfig;

    if (!authorizeNetApiEndpoint) {
        return NextResponse.json(
            { message: "Authorize.net API Endpoint not configured." },
            { status: 500 },
        );
    }

    const transactionRequest = await request.json();

    const createTransactionRequest = {
        createTransactionRequest: {
            merchantAuthentication: {
                name: authorizeNetLoginId,
                transactionKey: authorizeNetTransactionKey,
            },
            transactionRequest: {
                transactionType: "authCaptureTransaction",
                ...transactionRequest,
            },
        },
    };

    const response = await fetch(authorizeNetApiEndpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(createTransactionRequest),
    });

    const status = response.status;
    const text = await response.text();

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

    if (!response.ok || responseJson?.messages?.resultCode === "Error") {
        return NextResponse.json(
            responseJson?.messages || { message: response.statusText },
            {
                status: !response.ok && status ? status : 500,
            },
        );
    }

    return NextResponse.json(responseJson);
}

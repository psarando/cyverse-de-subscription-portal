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

    if (!response.ok) {
        const text = await response.text();

        let errorJson;
        try {
            errorJson = JSON.parse(text);
        } catch {
            console.error("non-JSON error response", {
                status: response.status,
                url: authorizeNetApiEndpoint,
                text,
            });
        }

        return NextResponse.json(
            errorJson || { message: response.statusText },
            {
                status: response.status || 500,
            },
        );
    }

    const data = await response.json();
    return NextResponse.json(data);
}

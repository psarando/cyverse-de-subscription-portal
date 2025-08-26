import { auth } from "@/auth";
import getConfig from "next/config";
import { NextResponse } from "next/server";

export type TerrainError = {
    error_code?: string;
    message?: string;
    reason?: string;
    grouper_result_message?: string;
};

const { publicRuntimeConfig } = getConfig();

export async function terrainErrorResponse(url: string, response: Response) {
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

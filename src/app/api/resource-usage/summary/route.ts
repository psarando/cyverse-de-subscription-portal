import { auth } from "@/auth";
import getConfig from "next/config";
import { NextResponse } from "next/server";

const { publicRuntimeConfig } = getConfig();

export async function GET() {
    const { terrainBaseUrl } = publicRuntimeConfig;
    if (!terrainBaseUrl) {
        return NextResponse.json(
            { message: "Terrain Base URL not configured." },
            { status: 500 },
        );
    }

    const session = await auth();

    const response = await fetch(`${terrainBaseUrl}/resource-usage/summary`, {
        method: "GET",
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session?.accessToken}`,
        },
    });

    if (!response.ok) {
        const errorJson = await response.json();

        return NextResponse.json(
            errorJson || { message: `HTTP error ${response.status}` },
            {
                status: response.status || 500,
            },
        );
    }

    const data = await response.json();
    return NextResponse.json(data);
}

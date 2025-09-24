import {
    getServiceAccountToken,
    terrainErrorResponse,
} from "@/app/api/terrain";

import getConfig from "next/config";
import { NextResponse } from "next/server";

const { publicRuntimeConfig } = getConfig();

export async function GET() {
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

    const url = "/service/qms/addons";

    const response = await fetch(`${terrainBaseUrl}${url}`, {
        method: "GET",
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
        },
    });

    if (!response.ok) {
        return terrainErrorResponse(url, response);
    }

    const data = await response.json();
    return NextResponse.json(data);
}

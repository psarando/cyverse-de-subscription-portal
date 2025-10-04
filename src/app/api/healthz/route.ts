import { healthCheck } from "@/db";
import logger from "@/logging";
import { NextResponse } from "next/server";

export async function GET() {
    let databaseOK = false;
    let status = 500;

    try {
        const current_version = await healthCheck();
        if (current_version) {
            databaseOK = true;
            status = 200;
        }
    } catch (e) {
        logger.error("Database error", e);
    }

    return NextResponse.json({ databaseOK }, { status });
}

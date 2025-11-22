import { auth } from "@/auth";
import { getPurchasesByUsername } from "@/db";
import { OrderDir, PurchaseSortField } from "@/app/api/types";

import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
    const session = await auth();
    const username = session?.user?.username;

    if (!username) {
        return NextResponse.json(
            { message: "Sign In Required" },
            { status: 401 },
        );
    }

    const params = request.nextUrl.searchParams;
    const orderBy = params.get("orderBy")?.toLowerCase() as PurchaseSortField;
    const orderDir = params.get("orderDir")?.toLowerCase() as OrderDir;

    if (orderBy && !Object.values(PurchaseSortField).includes(orderBy)) {
        return NextResponse.json(
            {
                error_code: "ERR_BAD_REQUEST",
                message: "Invalid orderBy field",
            },
            { status: 400 },
        );
    }
    if (orderDir && !Object.values(OrderDir).includes(orderDir)) {
        return NextResponse.json(
            {
                error_code: "ERR_BAD_REQUEST",
                message: "Invalid orderDir",
            },
            { status: 400 },
        );
    }

    const orders = await getPurchasesByUsername(username, orderBy, orderDir);

    return NextResponse.json({ orders });
}

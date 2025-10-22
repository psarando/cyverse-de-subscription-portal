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
    const orderBy = params.get("orderBy") as PurchaseSortField;
    const orderDir = params.get("orderDir") as OrderDir;

    const orders = await getPurchasesByUsername(username, orderBy, orderDir);

    return NextResponse.json({
        orders: orders?.map((order) => ({
            ...order,
            err_count: parseInt(order.err_count),
        })),
    });
}

/**
 * @author psarando
 */
import { auth } from "@/auth";
import { getUserPurchase } from "@/db";

import { NextResponse } from "next/server";

export async function GET(
    request: Request,
    { params }: { params: Promise<{ poNumber: string }> },
) {
    const session = await auth();
    const username = session?.user?.username;

    if (!username) {
        return NextResponse.json(
            { message: "Sign In Required" },
            { status: 401 },
        );
    }

    const { poNumber } = await params;

    const order = await getUserPurchase(username, parseInt(poNumber));

    if (!order) {
        return NextResponse.json(
            { message: "Order not found" },
            { status: 404 },
        );
    }

    return NextResponse.json(order);
}

import { auth } from "@/auth";
import { getPurchasesByUsername } from "@/db";

import { NextResponse } from "next/server";

export async function GET() {
    const session = await auth();
    const username = session?.user?.username;

    if (!username) {
        return NextResponse.json(
            { message: "Sign In Required" },
            { status: 401 },
        );
    }

    const orders = await getPurchasesByUsername(username);

    return NextResponse.json({ orders });
}

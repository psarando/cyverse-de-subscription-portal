import { NextRequest, NextResponse } from "next/server";
import { addBasePath } from "next/dist/client/add-base-path";

import { auth } from "@/auth";
import { maintenanceEnabled } from "@/db";

export const config = {
    // nodejs runtime is required for `@/db` functions, which use the `logger`.
    runtime: "nodejs",
    matcher: [
        /*
         * Match all request paths except for the ones starting with:
         * - maintenance (maintenance files)
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico (favicon file)
         * - *.png or *.svg (image files)
         */
        "/((?!maintenance.*|_next/static|_next/image|favicon.ico|.*\\.png$|.*\\.svg$).*)",
    ],
};

export async function middleware(request: NextRequest) {
    const maintenance = await maintenanceEnabled();

    if (maintenance) {
        const protocol = request.nextUrl.href.startsWith("https")
            ? "https://"
            : "http://";
        const host = request.nextUrl.host;
        const path = addBasePath("/maintenance.html");

        const session = await auth();
        if (!session?.user?.admin) {
            return NextResponse.rewrite(`${protocol}${host}${path}`);
        }
    }

    return NextResponse.next();
}

/**
 * @author psarando
 */
import logger from "@/logging";
import { CreateTransactionResponse } from "@/app/api/types";

import { createHmac } from "crypto";
import getConfig from "next/config";
import { NextRequest, NextResponse } from "next/server";

const { serverRuntimeConfig } = getConfig();

export async function POST(request: NextRequest) {
    const { authorizeNetSignatureKey } = serverRuntimeConfig;

    if (!authorizeNetSignatureKey) {
        return new NextResponse("Authorize.net Signature Key not configured.", {
            status: 500,
        });
    }

    const notification = await request.text();

    const hmac = createHmac("sha512", authorizeNetSignatureKey);
    hmac.update(notification);

    const signature = `sha512=${hmac.digest("hex")}`;
    if (request.headers.get("X-Anet-Signature")?.toLowerCase() !== signature) {
        return new NextResponse("Authorize.net Signature not verified.", {
            status: 401,
        });
    }

    let authorizeResponseJson:
        | {
              eventType?: string;
              eventDate?: string;
              payload?: CreateTransactionResponse["transactionResponse"] & {
                  id: string; // Transaction ID
                  merchantReferenceId: string; // PO Number
              };
          }
        | undefined;

    try {
        authorizeResponseJson = JSON.parse(notification);
    } catch {
        logger.error("Error parsing notification JSON: %o", {
            notification,
        });
        return new NextResponse("Error parsing notification JSON.", {
            status: 400,
        });
    }
    logger.debug("authorizeResponseJson: %O", authorizeResponseJson);

    return new NextResponse("ok");
}

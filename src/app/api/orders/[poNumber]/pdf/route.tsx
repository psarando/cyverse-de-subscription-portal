/**
 * @author psarando
 */
import {
    Page,
    Text,
    View,
    Document,
    StyleSheet,
    renderToBuffer,
} from "@react-pdf/renderer";

import { auth } from "@/auth";
import { getUserPurchase } from "@/db";

import { NextResponse } from "next/server";
import { LineItemIDEnum } from "@/app/api/types";
import { dateConstants, formatDate } from "@/utils/formatUtils";
import React from "react";

// Create styles
const pdfStyles = StyleSheet.create({
    page: {
        flexDirection: "row",
        // backgroundColor: "#E4E4E4",
    },
    section: {
        margin: 10,
        padding: 10,
        flexGrow: 1,
    },
});

// Create Document Component
const InvoicePdf = ({
    Amount,
    PoNumber,
    PurchaseTime,
    TransactionId,
    SubscriptionLevel,
    SubscriptionPeriod,
    SubscriptionPrice,
    Addons,
}: {
    Amount: string | undefined;
    PoNumber: string | undefined;
    PurchaseTime: string | undefined;
    TransactionId: string | null | undefined;
    SubscriptionLevel: string | undefined;
    SubscriptionPeriod: string | undefined;
    SubscriptionPrice: string | undefined;
    Addons:
        | Array<{
              Name: string;
              Quantity: number;
              Price: string;
          }>
        | undefined;
}) => (
    <Document>
        <Page size="A4" style={pdfStyles.page}>
            <View style={pdfStyles.section}>
                <Text>PoNumber</Text>
                <Text>PurchaseTime</Text>
                <Text>TransactionId</Text>
                {SubscriptionLevel && <Text>Subscription</Text>}
                {Addons && <Text>Addons</Text>}
                <Text>Order Total</Text>
            </View>
            <View style={pdfStyles.section}>
                <Text>{PoNumber}</Text>
                <Text>{PurchaseTime}</Text>
                <Text>{TransactionId ?? " "}</Text>
                {SubscriptionLevel && (
                    <>
                        <Text>
                            {SubscriptionLevel} Subscription for{" "}
                            {SubscriptionPeriod}: {SubscriptionPrice}
                        </Text>
                    </>
                )}
                {Addons &&
                    Addons.map((addon, i) => (
                        <Text key={i}>
                            {addon.Quantity} x {addon.Name}: {addon.Price}
                        </Text>
                    ))}
                <Text>{Amount}</Text>
            </View>
        </Page>
    </Document>
);

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

    const { orderDate, amount, transactionResponses, lineItems } = order;
    const transactionResponse = transactionResponses && transactionResponses[0];
    const orderedSubscription = lineItems?.find(
        (item) => item.itemId === LineItemIDEnum.SUBSCRIPTION,
    );

    return new NextResponse(
        await renderToBuffer(
            <InvoicePdf
                // user: common_name
                //     ? common_name
                //     : first_name || last_name
                //       ? `${first_name} ${last_name}`
                //       : username,
                Amount={amount}
                PoNumber={poNumber}
                PurchaseTime={formatDate(
                    new Date(orderDate as Date),
                    dateConstants.ISO_8601,
                )}
                TransactionId={transactionResponse?.transId}
                SubscriptionLevel={orderedSubscription?.name}
                SubscriptionPeriod={
                    orderedSubscription?.quantity === 1
                        ? "1 Year"
                        : orderedSubscription?.quantity === 2
                          ? "2 Years"
                          : undefined
                }
                SubscriptionPrice={orderedSubscription?.unitPrice}
                Addons={lineItems
                    ?.filter((item) => item.itemId === LineItemIDEnum.ADDON)
                    ?.map((addon) => ({
                        Name: addon.name,
                        Quantity: addon.quantity,
                        Price: addon.unitPrice,
                    }))}
            />,
        ),
        {
            headers: {
                "Content-Type": "application/pdf",
                // "Content-Disposition": `attachment; filename="CyVerse Invoice PO ${poNumber}.pdf"`,
                "Content-Disposition": `filename="CyVerse Invoice PO ${poNumber}.pdf"`,
            },
        },
    );

    // return NextResponse.json(order);
}

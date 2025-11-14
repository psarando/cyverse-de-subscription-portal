"use client";

/**
 * @author psarando
 */
import React from "react";

import {
    getOrderDetails,
    ORDER_DETAILS_QUERY_KEY,
} from "@/app/api/serviceFacade";
import {
    LineItemIDEnum,
    TransactionResponseCodeEnum,
    type OrderDetails,
} from "@/app/api/types";

import ErrorTypographyWithDialog from "@/components/common/error/ErrorTypographyWithDialog";
import GridLoading from "@/components/common/GridLoading";
import GridLabelValue from "@/components/common/GridLabelValue";

import { formatDate } from "@/utils/formatUtils";

import { Grid, Typography } from "@mui/material";
import { useQuery } from "@tanstack/react-query";

function OrderDetails({ poNumber }: { poNumber: number }) {
    const { isFetching, data, error } = useQuery<OrderDetails>({
        queryKey: [ORDER_DETAILS_QUERY_KEY, poNumber],
        queryFn: () => getOrderDetails(poNumber),
    });

    const { amount, orderDate, billTo, payment, transactionResponses } =
        data ?? {};

    const transactionResponse = transactionResponses && transactionResponses[0];
    const errorMsgs = transactionResponse?.errors || [];

    return error ? (
        <ErrorTypographyWithDialog
            errorMessage="Could not load order details."
            errorObject={error}
        />
    ) : isFetching ? (
        <GridLoading rows={8} />
    ) : (
        data && (
            <Grid container spacing={1}>
                <GridLabelValue label="PO Number">
                    <Typography>{poNumber}</Typography>
                </GridLabelValue>

                {orderDate && (
                    <GridLabelValue label="Order Date">
                        <Typography>
                            {formatDate(new Date(orderDate))}
                        </Typography>
                    </GridLabelValue>
                )}

                <GridLabelValue label="Transaction ID">
                    <Typography>{transactionResponse?.transId}</Typography>
                </GridLabelValue>

                {billTo && (
                    <GridLabelValue label="Billing Info">
                        <Typography>{`${billTo.firstName} ${billTo.lastName}`}</Typography>
                        {billTo.company && (
                            <Typography>{billTo.company}</Typography>
                        )}
                        <Typography>
                            {[
                                billTo.address,
                                billTo.city,
                                billTo.state,
                                billTo.zip,
                                billTo.country,
                            ].join(", ")}
                        </Typography>
                    </GridLabelValue>
                )}

                {payment?.creditCard && (
                    <GridLabelValue label="Payment Method">
                        <Typography>
                            {transactionResponse?.accountType || "Card"} ending
                            in{" "}
                            {transactionResponse?.accountNumber ||
                                payment?.creditCard.cardNumber}
                        </Typography>
                        <Typography>
                            Expires {payment?.creditCard.expirationDate}
                        </Typography>
                    </GridLabelValue>
                )}

                {data?.lineItems && data?.lineItems.length > 0 && (
                    <GridLabelValue label="Ordered Items">
                        {data?.lineItems.map((item) => (
                            <Typography key={item.id}>
                                {`${item.quantity} ${
                                    item.itemId === LineItemIDEnum.SUBSCRIPTION
                                        ? item.quantity > 1
                                            ? "Years"
                                            : "Year"
                                        : "x"
                                } ${item.name} ${item.itemId} @ ${item.unitPrice} each.`}
                            </Typography>
                        ))}
                    </GridLabelValue>
                )}

                <GridLabelValue label="Total">
                    <Typography>{amount}</Typography>
                </GridLabelValue>

                <GridLabelValue label="Transaction Status">
                    {transactionResponse?.responseCode ===
                    TransactionResponseCodeEnum.APPROVED ? (
                        <Typography color="success">Approved</Typography>
                    ) : transactionResponse?.responseCode ===
                      TransactionResponseCodeEnum.DECLINED ? (
                        <Typography color="error">Declined</Typography>
                    ) : transactionResponse?.responseCode ===
                      TransactionResponseCodeEnum.ERROR ? (
                        <Typography color="error">Error</Typography>
                    ) : transactionResponse?.responseCode ===
                      TransactionResponseCodeEnum.HELD_FOR_REVIEW ? (
                        <Typography color="error">Held For Review</Typography>
                    ) : (
                        <Typography color="error">
                            The transaction was not processed.
                        </Typography>
                    )}
                </GridLabelValue>

                {errorMsgs.length > 0 ? (
                    <GridLabelValue label="Errors" color="error">
                        {errorMsgs.map((error) => (
                            <Typography key={error.errorText} color="error">
                                {error.errorText}
                            </Typography>
                        ))}
                    </GridLabelValue>
                ) : (
                    transactionResponse?.messages &&
                    transactionResponse.messages.length > 0 && (
                        <GridLabelValue label="Transaction Messages">
                            {transactionResponse.messages.map((msg) => (
                                <Typography
                                    key={msg.text}
                                    color={
                                        msg.code.startsWith("E")
                                            ? "error"
                                            : "success"
                                    }
                                >
                                    {msg.text}
                                </Typography>
                            ))}
                        </GridLabelValue>
                    )
                )}
            </Grid>
        )
    );
}

export default OrderDetails;

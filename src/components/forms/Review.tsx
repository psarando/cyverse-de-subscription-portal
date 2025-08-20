/**
 * Adapted from
 * https://github.com/mui/material-ui/tree/v7.2.0/docs/data/material/getting-started/templates/checkout
 *
 * @author psarando
 */
import React from "react";

import { OrderError } from "@/app/api/serviceFacade";
import { CartInfo } from "@/contexts/cart";
import { formatCurrency } from "@/utils/formatUtils";

import { CheckoutFormValues } from "./formatters";

import {
    Divider,
    List,
    ListItem,
    ListItemText,
    Stack,
    Typography,
} from "@mui/material";

export default function Review({
    cartInfo,
    values,
    orderError,
}: {
    cartInfo: CartInfo;
    values: CheckoutFormValues;
    orderError: OrderError | null;
}) {
    return (
        <Stack spacing={2}>
            <List disablePadding>
                {cartInfo.subscription && (
                    <ListItem sx={{ py: 1, px: 0 }}>
                        <ListItemText
                            primary={`${cartInfo.subscription?.plan_name} Subscription`}
                            secondary={
                                cartInfo.subscription?.periods === 2
                                    ? "2 Years"
                                    : "1 Year"
                            }
                        />
                        <Typography variant="body2">
                            {formatCurrency(
                                (cartInfo.subscription?.plan_rate || 0) *
                                    (cartInfo.subscription?.periods || 1),
                            )}
                        </Typography>
                    </ListItem>
                )}
            </List>
            <Divider />
            <Stack
                direction="column"
                divider={<Divider flexItem />}
                spacing={2}
                sx={{ my: 2 }}
            >
                <div>
                    <Typography variant="subtitle2" gutterBottom>
                        Billing details
                    </Typography>
                    {values.billTo.address && (
                        <>
                            <Typography gutterBottom>
                                {values.billTo.firstName}{" "}
                                {values.billTo.lastName}
                            </Typography>
                            <Typography gutterBottom>
                                {values.billTo.company}
                            </Typography>
                            <Typography
                                gutterBottom
                                sx={{ color: "text.secondary" }}
                            >
                                {[
                                    values.billTo.address,
                                    values.billTo.city,
                                    values.billTo.state,
                                    values.billTo.zip,
                                    values.billTo.country,
                                ].join(", ")}
                            </Typography>
                        </>
                    )}
                </div>
                <div>
                    <Typography variant="subtitle2" gutterBottom>
                        Payment details
                    </Typography>
                    {values.payment.creditCard.cardNumber && (
                        <Stack>
                            <Typography>
                                Card number ending in{" "}
                                {values.payment.creditCard.cardNumber
                                    .replaceAll(" ", "")
                                    .slice(-4)}
                            </Typography>
                            <Typography
                                variant="body2"
                                sx={{ color: "text.secondary" }}
                            >
                                Expires{" "}
                                {values.payment.creditCard.expirationDate}
                            </Typography>
                        </Stack>
                    )}
                </div>
                {orderError &&
                    (orderError?.transactionResponse?.errors?.map(
                        (error, index) => (
                            <Typography key={index} color="error" gutterBottom>
                                {error.errorText}
                            </Typography>
                        ),
                    ) || (
                        <Typography color="error" gutterBottom>
                            There was an error processing your order.
                        </Typography>
                    ))}
            </Stack>
        </Stack>
    );
}

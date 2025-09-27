/**
 * Adapted from
 * https://github.com/mui/material-ui/tree/v7.2.0/docs/data/material/getting-started/templates/checkout
 *
 * @author psarando
 */
import React from "react";

import constants from "@/constants";
import { OrderError } from "@/app/api/types";
import { CartInfo } from "@/contexts/cart";
import ExternalLink from "@/components/common/ExternalLink";

import FormCheckbox from "./FormCheckbox";
import { CheckoutFormValues } from "./formatters";
import Info from "./Info";
import OrderErrorCard from "./OrderErrorCard";

import { Field } from "formik";

import { Box, Divider, Stack, Typography } from "@mui/material";

export default function Review({
    cartInfo,
    subscriptionEndDate,
    values,
    orderError,
}: {
    cartInfo: CartInfo;
    subscriptionEndDate?: number;
    values: CheckoutFormValues;
    orderError: OrderError | null;
}) {
    return (
        <Stack spacing={2}>
            <Box sx={{ display: { xs: "flex", md: "none" } }}>
                <Info
                    cartInfo={cartInfo}
                    subscriptionEndDate={subscriptionEndDate}
                />
            </Box>
            <Divider sx={{ display: { xs: "flex", md: "none" } }} />
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
                <Field
                    name="termsAcknowledged"
                    component={FormCheckbox}
                    label={
                        <Typography>
                            I agree to the{" "}
                            <ExternalLink
                                href={constants.CYVERSE_POLICY_URL}
                                rel="noopener"
                            >
                                Terms of Use
                            </ExternalLink>
                            .
                        </Typography>
                    }
                />
                {orderError && <OrderErrorCard orderError={orderError} />}
            </Stack>
        </Stack>
    );
}

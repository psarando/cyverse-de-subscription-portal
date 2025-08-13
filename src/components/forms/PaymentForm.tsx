/**
 * Adapted from
 * https://github.com/mui/material-ui/tree/v7.2.0/docs/data/material/getting-started/templates/checkout
 *
 * @author psarando
 */
import React from "react";

import { Field, FieldProps } from "formik";

import FormTextField from "./FormTextField";

import { Box, Stack, Typography } from "@mui/material";
import { styled } from "@mui/material/styles";
import CreditCardRoundedIcon from "@mui/icons-material/CreditCardRounded";

const PaymentContainer = styled("div")(({ theme }) => ({
    display: "flex",
    flexDirection: "column",
    justifyContent: "space-between",
    width: "100%",
    height: 200,
    padding: theme.spacing(3),
    borderRadius: `calc(${theme.shape.borderRadius}px + 4px)`,
    border: "1px solid ",
    borderColor: (theme.vars || theme).palette.divider,
    background:
        "linear-gradient(to bottom right, hsla(220, 35%, 97%, 0.3) 25%, hsla(220, 20%, 88%, 0.3) 100%)",
    boxShadow: "0px 4px 8px hsla(210, 0%, 0%, 0.05)",
    ...theme.applyStyles("dark", {
        background:
            "linear-gradient(to right bottom, hsla(220, 30%, 6%, 0.2) 25%, hsla(220, 20%, 25%, 0.2) 100%)",
        boxShadow: "0px 4px 8px hsl(220, 35%, 0%)",
    }),
}));

const FormGrid = styled("div")(() => ({
    display: "flex",
    flexDirection: "column",
}));

const handleCardNumberChange =
    (setFieldValue: FieldProps["form"]["setFieldValue"], fieldName: string) =>
    (event: React.ChangeEvent<HTMLInputElement>) => {
        const value = event.target.value.replace(/\D/g, "");
        const formattedValue = value.replace(/(\d{4})(?=\d)/g, "$1 ");
        if (value.length <= 16) {
            setFieldValue(fieldName, formattedValue);
        }
    };

const handleExpirationDateChange =
    (setFieldValue: FieldProps["form"]["setFieldValue"], fieldName: string) =>
    (event: React.ChangeEvent<HTMLInputElement>) => {
        const value = event.target.value;
        const formattedValue = value.replace(/(\d{4})(?=\d{2})/, "$1-");
        if (value.length <= 7) {
            setFieldValue(fieldName, formattedValue);
        }
    };

export default function PaymentForm({
    setFieldValue,
}: {
    setFieldValue: FieldProps["form"]["setFieldValue"];
}) {
    return (
        <Stack spacing={{ xs: 3, sm: 6 }} useFlexGap>
            <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
                <PaymentContainer>
                    <Box
                        sx={{
                            display: "flex",
                            justifyContent: "space-between",
                        }}
                    >
                        <Typography variant="subtitle2">Credit card</Typography>
                        <CreditCardRoundedIcon
                            sx={{ color: "text.secondary" }}
                        />
                    </Box>
                    <Box
                        sx={{
                            display: "flex",
                            justifyContent: "space-between",
                            width: "100%",
                            gap: 2,
                        }}
                    >
                        <FormGrid sx={{ flexGrow: 1 }}>
                            <Field
                                name="payment.creditCard.cardNumber"
                                component={FormTextField}
                                label="Card number"
                                autoComplete="card-number"
                                placeholder="0000 0000 0000 0000"
                                required
                                size="small"
                                onChange={handleCardNumberChange(
                                    setFieldValue,
                                    "payment.creditCard.cardNumber",
                                )}
                            />
                        </FormGrid>
                    </Box>
                    <Box sx={{ display: "flex", gap: 2 }}>
                        <FormGrid>
                            <Field
                                name="payment.creditCard.expirationDate"
                                component={FormTextField}
                                label="Expiration date"
                                autoComplete="card-expiration"
                                placeholder="YYYY-MM"
                                required
                                size="small"
                                fullWidth={false}
                                onChange={handleExpirationDateChange(
                                    setFieldValue,
                                    "payment.creditCard.expirationDate",
                                )}
                            />
                        </FormGrid>
                        <FormGrid sx={{ maxWidth: "25%" }}>
                            <Field
                                name="payment.creditCard.cardCode"
                                component={FormTextField}
                                label="CVV"
                                autoComplete="CVV"
                                placeholder="123"
                                required
                                size="small"
                            />
                        </FormGrid>
                    </Box>
                </PaymentContainer>
            </Box>
        </Stack>
    );
}

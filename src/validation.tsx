import { OrderRequest } from "@/app/api/types";
import { CheckoutFormValues } from "@/components/forms/formatters";

import * as Yup from "yup";

const schemaStringMaxLen = (label: string, max: number) =>
    Yup.string().trim().max(max, `${label} must be at most ${max} characters`);

const schemaRequiredStringMaxLen = (label: string, max: number) =>
    schemaStringMaxLen(label, max).required(`${label} is required`);

export const CheckoutFormSchema: Yup.ObjectSchema<CheckoutFormValues> =
    Yup.object().shape({
        termsAcknowledged: Yup.boolean()
            .required("You must agree to the Terms of Use")
            .oneOf([true], "You must agree to the Terms of Use"),
        payment: Yup.object().shape({
            creditCard: Yup.object().shape({
                cardNumber: Yup.string()
                    .required("Card number is required")
                    .transform((value) => value?.replaceAll(" ", ""))
                    .matches(/^\d+$/, "Card number must be digits")
                    .min(13, "Card number must be 13 - 16 digits")
                    .max(16, "Card number must be 13 - 16 digits"),
                expirationDate: Yup.string()
                    .required("Expiration date is required")
                    .matches(
                        /^(\d{4})-(\d{2})/,
                        "Expiration must be in YYYY-MM format",
                    ),
                cardCode: Yup.string()
                    .required("CVV is required")
                    .matches(/^\d+$/, "CVV must be digits")
                    .min(3, "CVV must be at least 3 digits")
                    .max(4, "CVV must be 3 or 4 digits"),
            }),
        }),
        billTo: Yup.object().shape({
            firstName: schemaRequiredStringMaxLen("First name", 50),
            lastName: schemaRequiredStringMaxLen("Last name", 50),
            company: schemaStringMaxLen("Company", 60),
            address: schemaRequiredStringMaxLen("Address", 60),
            city: schemaRequiredStringMaxLen("City", 40),
            state: schemaRequiredStringMaxLen("State", 40),
            zip: schemaRequiredStringMaxLen("Zip code", 20),
            country: Yup.string()
                .required("Country code is required")
                .trim()
                .length(2, "Please use a 2 character country code"),
        }),
    });

export const OrderRequestSchema: Yup.ObjectSchema<OrderRequest> =
    CheckoutFormSchema.concat(
        Yup.object().shape({
            amount: Yup.number()
                .required("Amount is required")
                .positive("Amount must be positive"),
            currencyCode: Yup.string()
                .required("Currency code is required")
                .trim()
                .length(3, "Please use a 3 character currency code"),
            lineItems: Yup.array().of(
                Yup.object().shape({
                    lineItem: Yup.object().shape({
                        itemId: schemaRequiredStringMaxLen(
                            "Line Item ID is required",
                            31,
                        ),
                        name: schemaRequiredStringMaxLen(
                            "Line Item Name is required",
                            30,
                        ),
                        description: schemaStringMaxLen("Description", 255),
                        quantity: Yup.number()
                            .required("Line Item Quantity is required")
                            .positive("Line Item Quantity must be positive"),
                        unitPrice: Yup.number()
                            .required("Line Item Unit Price is required")
                            .positive("Line Item Unit Price must be positive"),
                    }),
                }),
            ),
        }),
    );

"use client";

/**
 * Adapted from
 * https://github.com/mui/material-ui/tree/v7.2.0/docs/data/material/getting-started/templates/checkout
 *
 * @author psarando
 */
import React from "react";

import { useSession } from "next-auth/react";

import { FieldProps, Formik } from "formik";
import * as Yup from "yup";

import {
    Box,
    Button,
    Card,
    CardContent,
    Grid,
    Step,
    StepLabel,
    Stepper,
    Typography,
} from "@mui/material";
import ChevronLeftRoundedIcon from "@mui/icons-material/ChevronLeftRounded";
import ChevronRightRoundedIcon from "@mui/icons-material/ChevronRightRounded";
import { useQuery } from "@tanstack/react-query";

import {
    getPlanTypes,
    PLAN_TYPES_QUERY_KEY,
    PlanType,
    SubscriptionSubmission,
} from "@/app/api/serviceFacade";
import { CartInfo, useCartInfo } from "@/contexts/cart";
import GridLoading from "@/components/common/GridLoading";
import { formatCurrency } from "@/utils/formatUtils";

import AddressForm from "./AddressForm";
import Info from "./Info";
import InfoMobile from "./InfoMobile";
import PaymentForm from "./PaymentForm";
import Review from "./Review";
import getFormError from "./getFormError";
import {
    CheckoutFormValues,
    formatCheckoutFormValues,
    formatCheckoutTransactionRequest,
} from "./formatters";

const steps = ["Billing address", "Payment details", "Review your order"];
function getStepContent(
    step: number,
    checkoutCart: CartInfo,
    values: CheckoutFormValues,
    setFieldValue: FieldProps["form"]["setFieldValue"],
) {
    switch (step) {
        case 0:
            return <AddressForm />;
        case 1:
            return <PaymentForm setFieldValue={setFieldValue} />;
        case 2:
            return <Review cartInfo={checkoutCart} values={values} />;
        default:
            throw new Error("Unknown step");
    }
}

const schemaStringMaxLen = (max: number): Yup.StringSchema =>
    Yup.string().max(max, `Must be at most ${max} characters.`);

const schemaRequiredStringMaxLen = (max: number): Yup.StringSchema =>
    schemaStringMaxLen(max).required("Required");

export default function Checkout() {
    const { data: session } = useSession();
    const [cartInfo] = useCartInfo();

    const [activeStep, setActiveStep] = React.useState(0);
    const handleNext = () => {
        setActiveStep(activeStep + 1);
    };
    const handleBack = () => {
        setActiveStep(activeStep - 1);
    };

    const { data: planTypesQueryData, isFetching: loadingPlanTypes } = useQuery(
        {
            queryKey: [PLAN_TYPES_QUERY_KEY],
            queryFn: getPlanTypes,
            staleTime: Infinity,
        },
    );

    let planTypes: PlanType[] = [];
    if (planTypesQueryData?.result) {
        planTypes = [...planTypesQueryData.result];
    }

    const subscription = cartInfo.subscription;
    const planRate = planTypes.find(
        (plan) => plan.name === subscription?.plan_name,
    )?.plan_rates[0].rate;

    const checkoutCart: CartInfo = {};
    if (subscription) {
        checkoutCart.totalPrice = (planRate || 0) * subscription.periods;
        checkoutCart.subscription = {
            ...(subscription as SubscriptionSubmission),
            plan_rate: planRate,
        };
    }

    const validationSchema = Yup.object().shape({
        payment: Yup.object().shape({
            creditCard: Yup.object().shape({
                cardNumber: Yup.string()
                    .required("Required")
                    // Add 3 to min and max to allow for spaces.
                    .min(16, "Must be 13 - 16 digits.")
                    .max(19, "Must be 13 - 16 digits."),
                expirationDate: Yup.string()
                    .required("Required")
                    .matches(/^(\d{4})-(\d{2})/, "Must be YYYY-MM format."),
                cardCode: Yup.string()
                    .required("Required")
                    .matches(/^\d+$/, "Must be digits.")
                    .min(3, "Must be at least 3 digits.")
                    .max(4, "Must be 3 or 4 digits."),
            }),
        }),
        billTo: Yup.object().shape({
            firstName: schemaRequiredStringMaxLen(50),
            lastName: schemaRequiredStringMaxLen(50),
            company: schemaStringMaxLen(60),
            address: schemaRequiredStringMaxLen(60),
            city: schemaRequiredStringMaxLen(40),
            state: schemaRequiredStringMaxLen(40),
            zip: schemaRequiredStringMaxLen(20),
            country: Yup.string()
                .required("Required")
                .length(2, "Please use a 2 character country code."),
        }),
    });

    return (
        <Grid
            container
            sx={{
                height: {
                    xs: "100%",
                    // The AppBar height is 64px.
                    sm: "calc(100dvh - var(--template-frame-height, 64px))",
                },
                mt: {
                    xs: 4,
                    sm: 0,
                },
            }}
        >
            <Grid
                size={{ xs: 12, sm: 5, lg: 4 }}
                sx={{
                    display: { xs: "none", md: "flex" },
                    flexDirection: "column",
                    backgroundColor: "background.paper",
                    borderRight: { sm: "none", md: "1px solid" },
                    borderColor: { sm: "none", md: "divider" },
                    alignItems: "start",
                    px: 10,
                    gap: 4,
                }}
            >
                <Box
                    sx={{
                        display: "flex",
                        flexDirection: "column",
                        flexGrow: 1,
                        width: "100%",
                        maxWidth: 500,
                    }}
                >
                    {loadingPlanTypes ? (
                        <GridLoading />
                    ) : (
                        <Info cartInfo={checkoutCart} />
                    )}
                </Box>
            </Grid>
            <Formik
                enableReinitialize
                initialValues={formatCheckoutFormValues()}
                validationSchema={validationSchema}
                onSubmit={(values) => {
                    console.log(
                        "onSubmit values:",
                        formatCheckoutTransactionRequest(
                            session?.user?.username as string,
                            checkoutCart,
                            values,
                        ),
                    );
                }}
            >
                {({ handleSubmit, setFieldValue, values, errors, touched }) => {
                    const hasStepError = (stepIndex: number) => {
                        let fieldNames: string[] = [];

                        if (stepIndex === 0) {
                            fieldNames = [
                                "billTo.firstName",
                                "billTo.lastName",
                                "billTo.company",
                                "billTo.address",
                                "billTo.city",
                                "billTo.state",
                                "billTo.zip",
                                "billTo.country",
                            ];
                        } else if (stepIndex === 1) {
                            fieldNames = [
                                "payment.creditCard.cardNumber",
                                "payment.creditCard.expirationDate",
                                "payment.creditCard.cardCode",
                            ];
                        }

                        return !!fieldNames.find((fieldName) =>
                            getFormError(fieldName, touched, errors),
                        );
                    };

                    return (
                        <Grid
                            size={{ sm: 12, md: 7, lg: 8 }}
                            sx={{
                                display: "flex",
                                flexDirection: "column",
                                maxWidth: "100%",
                                width: "100%",
                                backgroundColor: {
                                    xs: "transparent",
                                    sm: "background.default",
                                },
                                alignItems: "start",
                                px: { xs: 2, sm: 10 },
                                gap: { xs: 4, md: 8 },
                            }}
                        >
                            <Box
                                sx={{
                                    display: "flex",
                                    justifyContent: {
                                        sm: "space-between",
                                        md: "flex-end",
                                    },
                                    alignItems: "center",
                                    width: "100%",
                                    maxWidth: { sm: "100%", md: 600 },
                                }}
                            >
                                <Box
                                    sx={{
                                        display: { xs: "none", md: "flex" },
                                        flexDirection: "column",
                                        justifyContent: "space-between",
                                        alignItems: "flex-end",
                                        flexGrow: 1,
                                    }}
                                >
                                    <Stepper
                                        id="desktop-stepper"
                                        activeStep={activeStep}
                                        sx={{ width: "100%", height: 40 }}
                                    >
                                        {steps.map((label, stepIndex) => (
                                            <Step
                                                sx={{
                                                    ":first-child": { pl: 0 },
                                                    ":last-child": { pr: 0 },
                                                }}
                                                key={label}
                                            >
                                                <StepLabel
                                                    error={hasStepError(
                                                        stepIndex,
                                                    )}
                                                >
                                                    {label}
                                                </StepLabel>
                                            </Step>
                                        ))}
                                    </Stepper>
                                </Box>
                            </Box>
                            <Card
                                sx={{
                                    display: { xs: "flex", md: "none" },
                                    width: "100%",
                                }}
                            >
                                <CardContent
                                    sx={{
                                        display: "flex",
                                        width: "100%",
                                        alignItems: "center",
                                        justifyContent: "space-between",
                                    }}
                                >
                                    <div>
                                        <Typography
                                            variant="subtitle2"
                                            gutterBottom
                                        >
                                            Selected products
                                        </Typography>
                                        <Typography variant="body1">
                                            {formatCurrency(
                                                checkoutCart.totalPrice || 0,
                                            )}
                                        </Typography>
                                    </div>
                                    <InfoMobile cartInfo={checkoutCart} />
                                </CardContent>
                            </Card>
                            <Box
                                sx={{
                                    display: "flex",
                                    flexDirection: "column",
                                    flexGrow: 1,
                                    width: "100%",
                                    maxWidth: { sm: "100%", md: 600 },
                                    maxHeight: "720px",
                                    gap: { xs: 5, md: "none" },
                                }}
                            >
                                <Stepper
                                    id="mobile-stepper"
                                    activeStep={activeStep}
                                    alternativeLabel
                                    sx={{ display: { sm: "flex", md: "none" } }}
                                >
                                    {steps.map((label, stepIndex) => (
                                        <Step
                                            sx={{
                                                ":first-child": { pl: 0 },
                                                ":last-child": { pr: 0 },
                                                "& .MuiStepConnector-root": {
                                                    top: { xs: 6, sm: 12 },
                                                },
                                            }}
                                            key={label}
                                        >
                                            <StepLabel
                                                error={hasStepError(stepIndex)}
                                                sx={{
                                                    ".MuiStepLabel-labelContainer":
                                                        {
                                                            maxWidth: "70px",
                                                        },
                                                }}
                                            >
                                                {label}
                                            </StepLabel>
                                        </Step>
                                    ))}
                                </Stepper>
                                <React.Fragment>
                                    {getStepContent(
                                        activeStep,
                                        checkoutCart,
                                        values,
                                        setFieldValue,
                                    )}
                                    <Box
                                        sx={[
                                            {
                                                display: "flex",
                                                flexDirection: {
                                                    xs: "column-reverse",
                                                    sm: "row",
                                                },
                                                alignItems: "end",
                                                flexGrow: 1,
                                                gap: 1,
                                                pb: { xs: 12, sm: 0 },
                                                mt: { xs: 2, sm: 0 },
                                                mb: "60px",
                                            },
                                            activeStep !== 0
                                                ? {
                                                      justifyContent:
                                                          "space-between",
                                                  }
                                                : {
                                                      justifyContent:
                                                          "flex-end",
                                                  },
                                        ]}
                                    >
                                        {activeStep !== 0 && (
                                            <Button
                                                startIcon={
                                                    <ChevronLeftRoundedIcon />
                                                }
                                                onClick={handleBack}
                                                variant="text"
                                                sx={{
                                                    display: {
                                                        xs: "none",
                                                        sm: "flex",
                                                    },
                                                }}
                                            >
                                                Previous
                                            </Button>
                                        )}
                                        {activeStep !== 0 && (
                                            <Button
                                                startIcon={
                                                    <ChevronLeftRoundedIcon />
                                                }
                                                onClick={handleBack}
                                                variant="outlined"
                                                fullWidth
                                                sx={{
                                                    display: {
                                                        xs: "flex",
                                                        sm: "none",
                                                    },
                                                }}
                                            >
                                                Previous
                                            </Button>
                                        )}
                                        <Button
                                            variant="contained"
                                            endIcon={
                                                <ChevronRightRoundedIcon />
                                            }
                                            onClick={
                                                activeStep === steps.length - 1
                                                    ? () => handleSubmit()
                                                    : handleNext
                                            }
                                            sx={{
                                                width: {
                                                    xs: "100%",
                                                    sm: "fit-content",
                                                },
                                            }}
                                        >
                                            {activeStep === steps.length - 1
                                                ? "Place order"
                                                : "Next"}
                                        </Button>
                                    </Box>
                                </React.Fragment>
                            </Box>
                        </Grid>
                    );
                }}
            </Formik>
        </Grid>
    );
}

"use client";

/**
 * Adapted from
 * https://github.com/mui/material-ui/tree/v7.2.0/docs/data/material/getting-started/templates/checkout
 *
 * @author psarando
 */
import React from "react";

import { useSession } from "next-auth/react";

import { FieldProps, Formik, FormikHelpers } from "formik";
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
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
    getPlanTypes,
    HttpError,
    PLAN_TYPES_QUERY_KEY,
    postOrder,
} from "@/app/api/serviceFacade";
import { OrderError, PlanType, SubscriptionSubmission } from "@/app/api/types";
import { CartInfo, useCartInfo } from "@/contexts/cart";
import GridLoading from "@/components/common/GridLoading";
import {
    ERROR,
    SUCCESS,
} from "@/components/common/announcer/AnnouncerConstants";
import { announce } from "@/components/common/announcer/CyVerseAnnouncer";
import withErrorAnnouncer, {
    WithErrorAnnouncerProps,
} from "@/components/common/error/withErrorAnnouncer";
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
    orderError: OrderError | null,
) {
    switch (step) {
        case 0:
            return <AddressForm />;
        case 1:
            return <PaymentForm setFieldValue={setFieldValue} />;
        case 2:
            return (
                <Review
                    cartInfo={checkoutCart}
                    values={values}
                    orderError={orderError}
                />
            );
        default:
            throw new Error("Unknown step");
    }
}

const schemaStringMaxLen = (max: number) =>
    Yup.string().trim().max(max, `Must be at most ${max} characters.`);

const schemaRequiredStringMaxLen = (max: number) =>
    schemaStringMaxLen(max).required("Required");

function Checkout({ showErrorAnnouncer }: WithErrorAnnouncerProps) {
    const { data: session } = useSession();
    const [cartInfo] = useCartInfo();

    const queryClient = useQueryClient();
    const { mutate: submitOrder } = useMutation({ mutationFn: postOrder });

    const [orderError, setOrderError] = React.useState<OrderError | null>(null);

    const [activeStep, setActiveStep] = React.useState(0);
    const handleNext = () => {
        setActiveStep(activeStep + 1);
    };
    const handleBack = () => {
        setActiveStep(activeStep - 1);
    };

    const { data: planTypesQueryData, isFetching: loadingPlanTypes } =
        useQuery<{ result: PlanType[] }>({
            queryKey: [PLAN_TYPES_QUERY_KEY],
            queryFn: getPlanTypes,
            staleTime: Infinity,
        });

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

    const validationSchema: Yup.ObjectSchema<CheckoutFormValues> =
        Yup.object().shape({
            termsAcknowledged: Yup.boolean()
                .required("Required")
                .oneOf([true], "You must agree to the Terms of Use."),
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
                    .trim()
                    .length(2, "Please use a 2 character country code."),
            }),
        });

    const onSubmit = (
        values: CheckoutFormValues,
        { setSubmitting, setFieldError }: FormikHelpers<CheckoutFormValues>,
    ) => {
        setOrderError(null);

        if (!cartInfo.subscription) {
            announce({ text: "Your cart is empty.", variant: ERROR });
            return;
        }

        submitOrder(
            formatCheckoutTransactionRequest(
                session?.user?.username as string,
                checkoutCart,
                // The schema's `cast` function will also trim string values.
                validationSchema.cast(values),
            ),
            {
                onSuccess: (response) => {
                    console.log("Order response:", response);
                    setSubmitting(false);
                    announce({
                        text: "Order placed successfully!",
                        variant: SUCCESS,
                    });
                },
                onError(error) {
                    setSubmitting(false);

                    let errorData;

                    if (error instanceof HttpError) {
                        try {
                            errorData = JSON.parse(error.response);

                            if (errorData?.transactionResponse?.errors) {
                                setOrderError(errorData);

                                const errors = (errorData as OrderError)
                                    .transactionResponse?.errors;

                                errors?.forEach((err) => {
                                    // For all error codes, see
                                    // https://developer.authorize.net/api/reference/dist/json/responseCodes.json
                                    switch (err.errorCode) {
                                        case "6":
                                            setFieldError(
                                                "payment.creditCard.cardNumber",
                                                err.errorText,
                                            );
                                            break;
                                        case "7":
                                        case "8":
                                            setFieldError(
                                                "payment.creditCard.expirationDate",
                                                err.errorText,
                                            );
                                            break;
                                        case "27":
                                            setFieldError(
                                                "billTo",
                                                err.errorText,
                                            );
                                            break;
                                        default:
                                            break;
                                    }
                                });
                            } else if (error.status === 409) {
                                setOrderError(errorData);

                                // A conflict error is caused when prices
                                // submitted from the client don't match
                                // what the server fetched from terrain.
                                // So refetch the current pricing for plans.
                                queryClient.invalidateQueries({
                                    queryKey: [PLAN_TYPES_QUERY_KEY],
                                });
                            }
                        } catch {
                            console.error({
                                errorResponse: error.response,
                            });
                        }
                    }

                    showErrorAnnouncer(
                        "There was an error placing your order. Please try again.",
                        error,
                    );
                },
            },
        );
    };

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
                onSubmit={onSubmit}
            >
                {({
                    handleSubmit,
                    setFieldValue,
                    isSubmitting,
                    values,
                    errors,
                    touched,
                }) => {
                    const hasStepError = (stepIndex: number) => {
                        let fieldNames: string[] = [];

                        if (stepIndex === 0) {
                            fieldNames = [
                                "billTo",
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
                        } else if (stepIndex === 2) {
                            fieldNames = ["termsAcknowledged"];
                        }

                        return !!fieldNames.find((fieldName) => {
                            const fieldError = getFormError(
                                fieldName,
                                touched,
                                errors,
                            );

                            // Once `billTo` has a field with an error,
                            // it becomes an object, regardless if those fields
                            // have been touched yet, so only look for actual
                            // error messages.
                            return typeof fieldError === "string";
                        });
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
                                        orderError,
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
                                            disabled={isSubmitting}
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

export default withErrorAnnouncer(Checkout);

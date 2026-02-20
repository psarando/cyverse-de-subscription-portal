"use client";

/**
 * Adapted from
 * https://github.com/mui/material-ui/tree/v7.2.0/docs/data/material/getting-started/templates/checkout
 *
 * @author psarando
 */
import React from "react";

import { useSession } from "next-auth/react";

import { Field, Formik, FormikHelpers } from "formik";

import {
    Box,
    Button,
    Divider,
    Grid,
    Stack,
    Toolbar,
    Typography,
} from "@mui/material";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import constants from "@/constants";
import {
    getResourceUsageSummary,
    HttpError,
    PLAN_TYPES_QUERY_KEY,
    postOrder,
    RESOURCE_USAGE_QUERY_KEY,
} from "@/app/api/serviceFacade";
import {
    OrderError,
    OrderUpdateResult,
    ResourceUsageSummary,
} from "@/app/api/types";
import { useCartInfo } from "@/contexts/cart";
import BackButton from "@/components/common/BackButton";
import ExternalLink from "@/components/common/ExternalLink";
import GridLoading from "@/components/common/GridLoading";
import { ERROR } from "@/components/common/announcer/AnnouncerConstants";
import { announce } from "@/components/common/announcer/CyVerseAnnouncer";
import ErrorHandler from "@/components/common/error/ErrorHandler";
import withErrorAnnouncer, {
    WithErrorAnnouncerProps,
} from "@/components/common/error/withErrorAnnouncer";
import { CheckoutFormSchema } from "@/validation";

import Info from "./Info";
import {
    CheckoutFormValues,
    formatCheckoutFormValues,
    formatCheckoutTransactionRequest,
} from "./formatters";
import FormCheckbox from "./FormCheckbox";
import OrderErrorCard from "./OrderErrorCard";

function Checkout({
    authorizeNetHostedEndpoint,
    showErrorAnnouncer,
}: WithErrorAnnouncerProps & { authorizeNetHostedEndpoint: string }) {
    const { data: session } = useSession();
    const [cartInfo, setCartInfo] = useCartInfo();

    const formRef = React.useRef<HTMLFormElement | null>(null);
    const tokenInputRef = React.useRef<HTMLInputElement | null>(null);

    const queryClient = useQueryClient();
    const { mutate: submitOrder } = useMutation({ mutationFn: postOrder });

    const [orderError, setOrderError] = React.useState<OrderError | null>(null);

    const {
        isFetching: loadingResourceUsage,
        data: resourceUsageSummary,
        error: resourceUsageError,
    } = useQuery<ResourceUsageSummary>({
        queryKey: [RESOURCE_USAGE_QUERY_KEY],
        queryFn: getResourceUsageSummary,
    });

    const currentSubscription = resourceUsageSummary?.subscription;

    const onSubmit = (
        values: CheckoutFormValues,
        { setSubmitting }: FormikHelpers<CheckoutFormValues>,
    ) => {
        setOrderError(null);

        if (
            !(
                cartInfo.subscription ||
                (cartInfo.addons && cartInfo.addons.length)
            )
        ) {
            announce({ text: "Your cart is empty.", variant: ERROR });
            return;
        }

        submitOrder(
            formatCheckoutTransactionRequest(
                session?.user?.username as string,
                currentSubscription,
                cartInfo,
                // The schema's `cast` function will also trim string values.
                CheckoutFormSchema.cast(values),
            ),
            {
                onSuccess: (order: OrderUpdateResult) => {
                    setCartInfo({ order });
                    setSubmitting(false);

                    queryClient.invalidateQueries({
                        queryKey: [RESOURCE_USAGE_QUERY_KEY],
                    });

                    if (tokenInputRef.current && order.token) {
                        tokenInputRef.current.value = order.token;
                        formRef.current?.submit();
                    } else {
                        console.log("no input or token", {
                            token: order.token,
                            tokenInputRef: tokenInputRef.current,
                        });
                        showErrorAnnouncer(
                            "There was an error placing your order. Please try again.",
                            order,
                        );
                    }
                },
                onError(error) {
                    setSubmitting(false);

                    if (error instanceof HttpError) {
                        if (error.status === 409) {
                            try {
                                setOrderError(JSON.parse(error.response));
                            } catch {
                                console.error({
                                    errorResponse: error.response,
                                });
                            }

                            // A conflict error is caused when prices
                            // submitted from the client don't match
                            // what the server fetched from terrain.
                            // So refetch the current pricing for plans.
                            queryClient.invalidateQueries({
                                queryKey: [PLAN_TYPES_QUERY_KEY],
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

    return resourceUsageError ? (
        <Box maxWidth="sm">
            <BackButton />
            <ErrorHandler errorObject={resourceUsageError} />
        </Box>
    ) : (
        <Formik
            enableReinitialize
            initialValues={formatCheckoutFormValues()}
            validationSchema={CheckoutFormSchema}
            onSubmit={onSubmit}
        >
            {({ handleSubmit, isSubmitting }) => {
                return (
                    <Grid
                        container
                        sx={{
                            mt: {
                                sm: 4,
                                md: 0,
                            },
                        }}
                    >
                        <Toolbar sx={{ width: "100%" }}>
                            <BackButton />
                        </Toolbar>
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
                                {loadingResourceUsage ? (
                                    <GridLoading />
                                ) : (
                                    <Info subscription={currentSubscription} />
                                )}
                            </Box>
                        </Grid>
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
                                    flexDirection: "column",
                                    flexGrow: 1,
                                    width: "100%",
                                    maxWidth: { sm: "100%", md: 600 },
                                    maxHeight: "720px",
                                    gap: { xs: 5, md: "none" },
                                }}
                            >
                                <Stack spacing={2}>
                                    <Box
                                        sx={{
                                            display: { xs: "flex", md: "none" },
                                        }}
                                    >
                                        <Info
                                            subscription={currentSubscription}
                                        />
                                    </Box>
                                    <Divider
                                        sx={{
                                            display: { xs: "flex", md: "none" },
                                        }}
                                    />
                                    <Stack
                                        direction="column"
                                        divider={<Divider flexItem />}
                                        spacing={2}
                                        sx={{ my: 2 }}
                                    >
                                        <Typography>
                                            By agreeing to the{" "}
                                            <ExternalLink
                                                href={
                                                    constants.CYVERSE_POLICY_URL
                                                }
                                                rel="noopener"
                                            >
                                                Terms of Use
                                            </ExternalLink>{" "}
                                            and selecting the{" "}
                                            <Typography
                                                variant="button"
                                                color="info"
                                            >
                                                {`"Proceed to Payment"`}
                                            </Typography>{" "}
                                            button below, you will be forwarded
                                            to{" "}
                                            <ExternalLink href="https://www.authorize.net">
                                                Authorize.net
                                            </ExternalLink>
                                            , where you can provide your billing
                                            and payment information. After your
                                            payment is approved, your
                                            subscription will be updated and an
                                            order confirmation will be sent to
                                            the primary email address associated
                                            with{" "}
                                            <ExternalLink
                                                href={
                                                    constants.USER_PORTAL_ACCOUNT
                                                }
                                                rel="noopener"
                                            >
                                                your CyVerse account
                                            </ExternalLink>
                                            .
                                        </Typography>
                                        <Field
                                            name="termsAcknowledged"
                                            component={FormCheckbox}
                                            label={
                                                <Typography>
                                                    I agree to the{" "}
                                                    <ExternalLink
                                                        href={
                                                            constants.CYVERSE_POLICY_URL
                                                        }
                                                        rel="noopener"
                                                    >
                                                        Terms of Use
                                                    </ExternalLink>
                                                    .
                                                </Typography>
                                            }
                                        />
                                        {orderError && (
                                            <OrderErrorCard
                                                orderError={orderError}
                                            />
                                        )}
                                    </Stack>
                                </Stack>
                                <Box
                                    sx={{
                                        display: "flex",
                                        flexDirection: {
                                            xs: "column-reverse",
                                            sm: "row",
                                        },
                                        alignItems: "end",
                                        justifyContent: "space-between",
                                        flexGrow: 1,
                                        gap: 1,
                                        pb: { xs: 12, sm: 0 },
                                        mt: { xs: 2, sm: 0 },
                                        mb: "60px",
                                    }}
                                >
                                    <Button
                                        variant="contained"
                                        disabled={isSubmitting}
                                        onClick={() => handleSubmit()}
                                        sx={{
                                            width: {
                                                xs: "100%",
                                                sm: "fit-content",
                                            },
                                        }}
                                    >
                                        Proceed to Payment
                                    </Button>
                                </Box>
                            </Box>
                        </Grid>
                        <form
                            ref={formRef}
                            method="post"
                            action={authorizeNetHostedEndpoint}
                        >
                            <input ref={tokenInputRef} hidden name="token" />
                        </form>
                    </Grid>
                );
            }}
        </Formik>
    );
}

export default withErrorAnnouncer(Checkout);

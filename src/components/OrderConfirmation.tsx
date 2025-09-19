"use client";

import constants from "@/constants";
import { useCartInfo } from "@/contexts/cart";
import { HttpError } from "@/app/api/serviceFacade";
import GridLabelValue from "@/components/common/GridLabelValue";
import { FormattedQuota } from "@/components/common/QuotaDetails";
import ErrorTypographyWithDialog from "@/components/common/error/ErrorTypographyWithDialog";
import { dateConstants, formatDate } from "@/utils/formatUtils";

import { Grid, Link, Stack, Typography } from "@mui/material";

function OrderConfirmation() {
    const [cartInfo] = useCartInfo();

    const order = cartInfo.order;
    const subscription = order?.subscription?.result;
    const planName = subscription?.plan?.name;
    const startDate = subscription?.effective_start_date;
    const endDate = subscription?.effective_end_date;

    return (
        <Stack spacing={2} useFlexGap>
            {!order ? (
                <Typography variant="h5">
                    You have no orders submitted this session.
                </Typography>
            ) : !order.success ? (
                <ErrorTypographyWithDialog
                    variant="h5"
                    errorMessage={
                        <>
                            Your order was placed successfully, but your
                            subscription could not be updated. Please allow a
                            few business days for your subscription to be
                            updated, or{" "}
                            <Link
                                href={constants.CYVERSE_SUPPORT_URL}
                                target="_blank"
                                rel="noopener"
                                underline="hover"
                            >
                                contact support
                            </Link>
                            . Your order number is{" "}
                            <strong>&nbsp;#{order.poNumber}</strong>.
                        </>
                    }
                    errorObject={
                        new HttpError(
                            order.error?.method || "",
                            order.error?.url || "",
                            order.error?.status || 500,
                            order.error?.message || "",
                            JSON.stringify(order.error?.response || {}),
                        )
                    }
                />
            ) : (
                <>
                    <Typography variant="h5">
                        Thank you for your order!
                    </Typography>
                    <Typography
                        variant="body1"
                        sx={{ color: "text.secondary" }}
                    >
                        Your order number is{" "}
                        <strong>&nbsp;#{order.poNumber}</strong>. We have
                        emailed your order confirmation.
                    </Typography>
                    <Typography>
                        Your ordered subscription tier is{" "}
                        <Link
                            href={constants.SUBSCRIBE_URL}
                            target="_blank"
                            rel="noopener"
                            underline="hover"
                        >
                            {planName}
                        </Link>
                    </Typography>
                    <Grid container>
                        <GridLabelValue label="Start Date">
                            <Typography>
                                {startDate &&
                                    formatDate(
                                        new Date(startDate),
                                        dateConstants.DATE_FORMAT,
                                    )}
                            </Typography>
                        </GridLabelValue>
                        <GridLabelValue label="End Date">
                            <Typography>
                                {endDate &&
                                    formatDate(
                                        new Date(endDate),
                                        dateConstants.DATE_FORMAT,
                                    )}
                            </Typography>
                        </GridLabelValue>
                        <GridLabelValue label="Quotas">
                            {subscription &&
                                subscription.quotas.length > 0 &&
                                subscription.quotas.map((item) => (
                                    <FormattedQuota
                                        key={item.id}
                                        quota={item.quota}
                                        resourceUnit={item.resource_type.unit}
                                    />
                                ))}
                        </GridLabelValue>
                    </Grid>
                </>
            )}
        </Stack>
    );
}

export default OrderConfirmation;

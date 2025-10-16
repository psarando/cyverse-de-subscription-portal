"use client";

import constants from "@/constants";
import { useCartInfo } from "@/contexts/cart";
import { HttpError } from "@/app/api/serviceFacade";
import BackButton from "@/components/common/BackButton";
import ExternalLink from "@/components/common/ExternalLink";
import GridLabelValue from "@/components/common/GridLabelValue";
import ErrorTypographyWithDialog from "@/components/common/error/ErrorTypographyWithDialog";
import { dateConstants, formatDate, formatQuota } from "@/utils/formatUtils";

import { Grid, Stack, Toolbar, Typography } from "@mui/material";

function OrderConfirmation() {
    const [cartInfo] = useCartInfo();

    const order = cartInfo.order;
    const subscription = order?.subscription?.result;
    const planName = subscription?.plan?.name;
    const startDate = subscription?.effective_start_date;
    const endDate = subscription?.effective_end_date;
    const addons = order?.addons?.filter((addon) => !addon.error);
    const orderDate = order?.orderDate;
    const transactionId = order?.transactionResponse?.transId;

    const orderError =
        order?.error || order?.addons?.find((addon) => addon.error)?.error;

    return (
        <>
            <Toolbar sx={{ width: "100%" }}>
                <BackButton />
            </Toolbar>
            <Stack spacing={2} useFlexGap>
                {!order ? (
                    <Typography variant="h5">
                        You have no orders submitted this session.
                    </Typography>
                ) : (
                    <>
                        {!order.success ? (
                            <ErrorTypographyWithDialog
                                variant="h5"
                                errorMessage={
                                    <>
                                        Your order was placed successfully, but
                                        your subscription could not be updated.
                                        Please allow a few business days for
                                        your subscription to be updated, or{" "}
                                        <ExternalLink
                                            href={constants.CYVERSE_SUPPORT_URL}
                                            rel="noopener"
                                        >
                                            contact support
                                        </ExternalLink>
                                        .<br />
                                        Your order number is{" "}
                                        <strong>&nbsp;#{order.poNumber}</strong>
                                        .
                                    </>
                                }
                                errorObject={
                                    new HttpError(
                                        orderError?.method || "",
                                        orderError?.url || "",
                                        orderError?.status || 500,
                                        orderError?.message || "",
                                        JSON.stringify(
                                            orderError?.response || {},
                                        ),
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
                                    <strong>&nbsp;#{order.poNumber}</strong>. We
                                    have emailed your order confirmation.
                                </Typography>
                            </>
                        )}

                        {subscription && (
                            <>
                                <Typography>
                                    Your ordered subscription tier is{" "}
                                    <ExternalLink
                                        href={constants.SUBSCRIBE_URL}
                                        rel="noopener"
                                    >
                                        {planName}
                                    </ExternalLink>
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
                                                <Typography key={item.id}>
                                                    {formatQuota(
                                                        item.quota,
                                                        item.resource_type.unit,
                                                    )}
                                                </Typography>
                                            ))}
                                    </GridLabelValue>
                                </Grid>
                            </>
                        )}

                        {addons && addons.length > 0 && (
                            <>
                                <Typography>Add-ons</Typography>
                                <Grid container>
                                    {addons.map((addon) => (
                                        <GridLabelValue
                                            key={addon.subscription_addon?.uuid}
                                            label={
                                                addon.subscription_addon?.addon
                                                    .name
                                            }
                                        >
                                            <Typography>
                                                {
                                                    addon.subscription_addon
                                                        ?.addon.description
                                                }
                                            </Typography>
                                        </GridLabelValue>
                                    ))}
                                </Grid>
                            </>
                        )}

                        <Grid container>
                            {orderDate && (
                                <GridLabelValue label="Order Date">
                                    <Typography>
                                        {formatDate(
                                            new Date(orderDate),
                                            dateConstants.ISO_8601,
                                        )}
                                    </Typography>
                                </GridLabelValue>
                            )}
                            {transactionId && (
                                <GridLabelValue label="Transaction ID">
                                    <Typography>{transactionId}</Typography>
                                </GridLabelValue>
                            )}
                        </Grid>
                    </>
                )}
            </Stack>
        </>
    );
}

export default OrderConfirmation;

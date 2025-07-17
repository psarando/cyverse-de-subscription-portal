"use client";

import constants from "@/constants";
import { getResourceUsageSummary } from "@/app/api/serviceFacade";
import { dateConstants, formatDate } from "@/utils/dateUtils";

import GridLabelValue from "./GridLabelValue";

import { UUID } from "crypto";
import numeral from "numeral";
import { Grid, Link, Paper, Skeleton, Typography } from "@mui/material";
import { useQuery } from "@tanstack/react-query";

const formatFileSize = (size: number) => {
    if (!size) {
        return "-";
    }
    if (size < 1024) {
        return numeral(size).format("0 ib");
    }

    return numeral(size).format("0.0 ib");
};

const formatUsage = (usage: number) => numeral(usage).format("0.00000");

type ResourceUsageSummaryType = {
    subscription: {
        plan: {
            name: string;
        };
        effective_start_date: number;
        effective_end_date: number;
        quotas: Array<{
            id: UUID;
            quota: number;
            resource_type: {
                description: string;
                unit: string;
            };
        }>;
        usages: Array<{
            id: UUID;
            usage: number;
            resource_type: {
                name: string;
                description: string;
            };
        }>;
    };
};

type SubscriptionDetailProps = ResourceUsageSummaryType;

const SubscriptionSummary = () => {
    const {
        isFetching,
        data,
        error: resourceUsageError,
    } = useQuery({
        queryKey: ["resourceUsageSummary"],
        queryFn: getResourceUsageSummary,
    });

    const resourceUsageSummary = data as ResourceUsageSummaryType;

    const subscription = resourceUsageSummary?.subscription;
    const currentPlanName = subscription?.plan?.name;
    const startDate = subscription?.effective_start_date;
    const endDate = subscription?.effective_end_date;

    return isFetching ? (
        <>
            <Skeleton variant="text" sx={{ width: 1 / 2, height: 1 }} />
            <Skeleton variant="text" sx={{ width: 1 / 2, height: 1 }} />
            <Skeleton variant="text" sx={{ width: 1 / 2, height: 1 }} />
            <Skeleton variant="text" sx={{ width: 1 / 2, height: 1 }} />
            <Skeleton variant="text" sx={{ width: 1 / 2, height: 1 }} />
        </>
    ) : resourceUsageError ? (
        <Typography>Error Loading Subscription Summary</Typography>
    ) : (
        <Paper
            sx={{
                p: 2,
                width: {
                    xs: "100%",
                    sm: "75%",
                    md: "50%",
                    lg: "30%",
                    xl: "25%",
                },
            }}
        >
            <Typography>
                Your current subscription tier is{" "}
                <Link
                    href={constants.SUBSCRIBE_URL}
                    target="_blank"
                    rel="noopener"
                    underline="hover"
                >
                    {currentPlanName}
                </Link>
            </Typography>
            <Grid container>
                <GridLabelValue label="Start Date">
                    <Typography>
                        {formatDate(
                            startDate && new Date(startDate),
                            dateConstants.DATE_FORMAT,
                        )}
                    </Typography>
                </GridLabelValue>
                <GridLabelValue label="End Date">
                    <Typography>
                        {formatDate(
                            endDate && new Date(endDate),
                            dateConstants.DATE_FORMAT,
                        )}
                    </Typography>
                </GridLabelValue>
                <GridLabelValue label="Quotas">
                    <QuotasDetails subscription={subscription} />
                </GridLabelValue>
                <GridLabelValue label="Usages">
                    <UsagesDetails subscription={subscription} />
                </GridLabelValue>
            </Grid>
        </Paper>
    );
};

const QuotasDetails = ({ subscription }: SubscriptionDetailProps) => {
    return (
        <>
            {subscription &&
                subscription.quotas.length > 0 &&
                subscription.quotas.map((item) => {
                    // Only format data storage resources to human readable format
                    const resourceInBytes =
                        item.resource_type.description.toLowerCase() ===
                        "bytes";
                    return (
                        <Typography key={item.id}>
                            {resourceInBytes
                                ? formatFileSize(item.quota)
                                : `${item.quota} ${item.resource_type.description} `}
                        </Typography>
                    );
                })}
        </>
    );
};

const UsagesDetails = ({ subscription }: SubscriptionDetailProps) => {
    return (
        <>
            {subscription &&
                subscription.usages.length > 0 &&
                subscription.usages.map((item) => {
                    // Format usage to readable format
                    const resourceInBytes =
                        item.resource_type.description.toLowerCase() ===
                        "bytes";
                    return (
                        <Typography key={item.id}>
                            {resourceInBytes
                                ? formatFileSize(item.usage)
                                : `${formatUsage(item.usage)} ${item.resource_type.description}`}
                        </Typography>
                    );
                })}

            {subscription && !subscription.usages.length && (
                <Typography>No Usages</Typography>
            )}
        </>
    );
};

export default SubscriptionSummary;

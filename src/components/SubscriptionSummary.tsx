"use client";

import constants from "@/constants";
import { getResourceUsageSummary } from "@/app/api/serviceFacade";

import GridLabelValue from "./GridLabelValue";

import { UUID } from "crypto";
import { Grid, Link, Paper, Skeleton, Typography } from "@mui/material";
import { useQuery } from "@tanstack/react-query";

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
                        {new Date(
                            subscription?.effective_start_date,
                        ).toLocaleString()}
                    </Typography>
                </GridLabelValue>
                <GridLabelValue label="End Date">
                    <Typography>
                        {new Date(
                            subscription?.effective_end_date,
                        ).toLocaleString()}
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
                    return (
                        <Typography key={item.id}>
                            {`${item.quota} ${item.resource_type.description} `}
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
                    return (
                        <Typography key={item.id}>
                            {`${item.usage} ${item.resource_type.description}`}
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

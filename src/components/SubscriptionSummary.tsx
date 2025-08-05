"use client";

import { useState } from "react";

import constants from "@/constants";
import {
    getResourceUsageSummary,
    RESOURCE_USAGE_QUERY_KEY,
    SubscriptionSummaryDetails,
} from "@/app/api/serviceFacade";
import GridLabelValue from "@/components/common/GridLabelValue";
import GridLoading from "@/components/common/GridLoading";
import QuotaDetails from "@/components/common/QuotaDetails";
import UsageDetails from "@/components/common/UsageDetails";
import { announce } from "@/components/common/announcer/CyVerseAnnouncer";
import { ERROR } from "@/components/common/announcer/AnnouncerConstants";
import ErrorHandler from "@/components/common/error/ErrorHandler";
import DETableHead from "@/components/common/table/DETableHead";
import { DERow } from "@/components/common/table/DERow";
import EmptyTable from "@/components/common/table/EmptyTable";
import TableLoading from "@/components/common/table/TableLoading";
import EditSubscription from "@/components/forms/EditSubscription";
import { dateConstants, formatDate, formatFileSize } from "@/utils/formatUtils";

import { addDays, toDate } from "date-fns";

import {
    Box,
    Button,
    Card,
    CardActions,
    CardContent,
    CardHeader,
    Grid,
    Link,
    Skeleton,
    Table,
    TableBody,
    TableCell,
    Typography,
} from "@mui/material";

import ShopIcon from "@mui/icons-material/Shop";

import { useQuery } from "@tanstack/react-query";

const ADDONS_TABLE_COLUMNS = [
    { name: "Add-on", numeric: false, enableSorting: false },
    { name: "Amount", numeric: false, enableSorting: false },
    { name: "Resource Type", numeric: false, enableSorting: false },
    { name: "Paid", numeric: false, enableSorting: false },
];

type ResourceUsageSummary = {
    subscription: SubscriptionSummaryDetails;
};

const SubscriptionSummary = () => {
    const [editSubscriptionOpen, setEditSubscriptionOpen] = useState(false);

    const {
        isFetching,
        data,
        error: resourceUsageError,
    } = useQuery({
        queryKey: [RESOURCE_USAGE_QUERY_KEY],
        queryFn: getResourceUsageSummary,
    });

    const resourceUsageSummary = data as ResourceUsageSummary;

    const subscription = resourceUsageSummary?.subscription;
    const currentPlanName = subscription?.plan?.name;
    const startDate = subscription?.effective_start_date;
    const endDate = subscription?.effective_end_date;

    const handleEditSubscriptionClick = () => {
        if (
            !subscription ||
            toDate(subscription.effective_end_date) > addDays(new Date(), 30)
        ) {
            announce({
                text: "You cannot renew your subscription more than 30 days before the end date.",
                variant: ERROR,
            });
        } else {
            setEditSubscriptionOpen(true);
        }
    };

    return resourceUsageError ? (
        <Box maxWidth="sm">
            <ErrorHandler errorObject={resourceUsageError} />
        </Box>
    ) : (
        <Grid container spacing={2} justifyContent="center">
            <Card
                sx={{
                    width: {
                        xs: "100%",
                        sm: "75%",
                        md: "50%",
                        lg: "30%",
                    },
                }}
            >
                <CardHeader
                    title={
                        isFetching ? (
                            <Skeleton variant="text" />
                        ) : (
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
                        )
                    }
                />
                <CardContent>
                    {isFetching ? (
                        <GridLoading rows={4} />
                    ) : (
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
                                <QuotaDetails subscription={subscription} />
                            </GridLabelValue>
                            <GridLabelValue label="Usages">
                                <UsageDetails subscription={subscription} />
                            </GridLabelValue>
                        </Grid>
                    )}
                </CardContent>
                <CardActions>
                    <Button
                        color="primary"
                        startIcon={<ShopIcon />}
                        onClick={handleEditSubscriptionClick}
                    >
                        {subscription &&
                        subscription.plan.name !== constants.PLAN_NAME_BASIC
                            ? "Renew"
                            : "Upgrade"}
                    </Button>
                </CardActions>
            </Card>

            <EditSubscription
                open={editSubscriptionOpen}
                onClose={() => setEditSubscriptionOpen(false)}
                subscription={subscription}
            />

            <Card>
                <CardHeader
                    title={<Typography>Subscription Add-ons</Typography>}
                />
                <CardContent>
                    <AddonsDetails
                        subscription={subscription}
                        loading={isFetching}
                    />
                </CardContent>
            </Card>
        </Grid>
    );
};

function AddonsDetails({
    subscription,
    loading,
}: {
    subscription: SubscriptionSummaryDetails;
    loading: boolean;
}) {
    const addons = subscription?.addons;

    return (
        <Table>
            <DETableHead columnData={ADDONS_TABLE_COLUMNS} />
            {loading ? (
                <TableLoading
                    numRows={3}
                    numColumns={ADDONS_TABLE_COLUMNS.length}
                />
            ) : (
                <TableBody>
                    {addons && !addons.length && (
                        <EmptyTable
                            message="No add-ons"
                            numColumns={ADDONS_TABLE_COLUMNS.length}
                        />
                    )}
                    {addons &&
                        addons.length > 0 &&
                        addons.map((item) => {
                            const resourceInBytes =
                                item.addon.resource_type.description.toLowerCase() ===
                                "bytes";
                            return (
                                <DERow key={item.id}>
                                    <TableCell>
                                        <Typography>
                                            {item.addon.name}
                                        </Typography>
                                    </TableCell>
                                    <TableCell>
                                        <Typography>
                                            {resourceInBytes
                                                ? formatFileSize(item.amount)
                                                : `${item.amount}`}
                                        </Typography>
                                    </TableCell>
                                    <TableCell>
                                        <Typography>
                                            {
                                                item.addon.resource_type
                                                    .description
                                            }
                                        </Typography>
                                    </TableCell>
                                    <TableCell>
                                        <Typography>
                                            {item.paid ? "True" : "False"}
                                        </Typography>
                                    </TableCell>
                                </DERow>
                            );
                        })}
                </TableBody>
            )}
        </Table>
    );
}

export default SubscriptionSummary;

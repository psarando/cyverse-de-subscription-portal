"use client";

import constants from "@/constants";
import { getResourceUsageSummary } from "@/app/api/serviceFacade";
import GridLabelValue from "@/components/common/GridLabelValue";
import GridLoading from "@/components/common/GridLoading";
import ErrorHandler from "@/components/common/error/ErrorHandler";
import DETableHead from "@/components/common/table/DETableHead";
import { DERow } from "@/components/common/table/DERow";
import EmptyTable from "@/components/common/table/EmptyTable";
import TableLoading from "@/components/common/table/TableLoading";
import { dateConstants, formatDate } from "@/utils/dateUtils";

import { UUID } from "crypto";
import numeral from "numeral";

import {
    Box,
    Card,
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
import { useQuery } from "@tanstack/react-query";

const ADDONS_TABLE_COLUMNS = [
    { name: "Add-on", numeric: false, enableSorting: false },
    { name: "Amount", numeric: false, enableSorting: false },
    { name: "Resource Type", numeric: false, enableSorting: false },
    { name: "Paid", numeric: false, enableSorting: false },
];

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
        addons: Array<{
            id: UUID;
            amount: number;
            paid: boolean;
            addon: {
                name: string;
                resource_type: {
                    name: string;
                    description: string;
                };
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

    return resourceUsageError ? (
        <Box maxWidth="sm">
            <ErrorHandler errorObject={resourceUsageError} />
        </Box>
    ) : (
        <Grid container spacing={2} justifyContent="center">
            <Card
                sx={{
                    p: 2,
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
                                <QuotasDetails subscription={subscription} />
                            </GridLabelValue>
                            <GridLabelValue label="Usages">
                                <UsagesDetails subscription={subscription} />
                            </GridLabelValue>
                        </Grid>
                    )}
                </CardContent>
            </Card>
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

function AddonsDetails({
    subscription,
    loading,
}: SubscriptionDetailProps & { loading: boolean }) {
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

"use client";

/**
 * @author psarando
 */
import React from "react";

import { getOrders, ORDERS_QUERY_KEY } from "@/app/api/serviceFacade";
import { OrderDir, OrdersList, PurchaseSortField } from "@/app/api/types";

import ErrorTypographyWithDialog from "@/components/common/error/ErrorTypographyWithDialog";
import DETableHead, {
    DETableHeadColumnData,
} from "@/components/common/table/DETableHead";
import { DERow } from "@/components/common/table/DERow";
import EmptyTable from "@/components/common/table/EmptyTable";
import TableLoading from "@/components/common/table/TableLoading";

import { dateConstants, formatDate } from "@/utils/formatUtils";

import { useQuery } from "@tanstack/react-query";

import {
    Card,
    CardContent,
    CardHeader,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    Typography,
} from "@mui/material";

const ORDERS_TABLE_COLUMNS: DETableHeadColumnData[] = [
    { key: "po_number", name: "PO Number", enableSorting: true },
    { key: "order_date", name: "Order Date", enableSorting: true },
    { key: "amount", name: "Amount", align: "right", enableSorting: true },
];

function OrderListing() {
    const [orderBy, setOrderBy] = React.useState<PurchaseSortField>(
        PurchaseSortField.PO_NUMBER,
    );
    const [orderDir, setOrderDir] = React.useState<OrderDir>(OrderDir.DESC);

    const { isFetching, data, error } = useQuery<OrdersList>({
        queryKey: [ORDERS_QUERY_KEY, orderBy, orderDir],
        queryFn: () => getOrders({ orderBy, orderDir }),
    });

    const onRequestSort = (
        event: React.MouseEvent<unknown>,
        property?: string,
    ): void => {
        if (orderBy === property) {
            setOrderDir(
                orderDir === OrderDir.ASC ? OrderDir.DESC : OrderDir.ASC,
            );
        } else {
            setOrderBy(property as PurchaseSortField);
        }
    };

    return (
        <Card sx={{ minWidth: { md: 640 } }}>
            <CardHeader title={<Typography>Order History</Typography>} />
            <CardContent>
                {error ? (
                    <ErrorTypographyWithDialog
                        errorMessage="Could not load order history."
                        errorObject={error}
                    />
                ) : (
                    <TableContainer sx={{ maxHeight: 240 }}>
                        <Table stickyHeader>
                            <DETableHead
                                columnData={ORDERS_TABLE_COLUMNS}
                                order={orderDir}
                                orderBy={orderBy}
                                onRequestSort={onRequestSort}
                            />
                            {isFetching ? (
                                <TableLoading
                                    numRows={3}
                                    numColumns={ORDERS_TABLE_COLUMNS.length}
                                />
                            ) : (
                                <TableBody>
                                    {!data || !data.orders.length ? (
                                        <EmptyTable
                                            message="No orders to display."
                                            numColumns={
                                                ORDERS_TABLE_COLUMNS.length
                                            }
                                        />
                                    ) : (
                                        data.orders.map(
                                            ({
                                                id,
                                                po_number,
                                                amount,
                                                order_date,
                                            }) => (
                                                <DERow key={id}>
                                                    <TableCell>
                                                        <Typography>
                                                            {po_number}
                                                        </Typography>
                                                    </TableCell>
                                                    <TableCell>
                                                        <Typography>
                                                            {formatDate(
                                                                new Date(
                                                                    order_date,
                                                                ),
                                                                dateConstants.DATE_FORMAT,
                                                            )}
                                                        </Typography>
                                                    </TableCell>
                                                    <TableCell align="right">
                                                        <Typography>
                                                            {amount}
                                                        </Typography>
                                                    </TableCell>
                                                </DERow>
                                            ),
                                        )
                                    )}
                                </TableBody>
                            )}
                        </Table>
                    </TableContainer>
                )}
            </CardContent>
        </Card>
    );
}

export default OrderListing;

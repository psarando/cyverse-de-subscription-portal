"use client";

/**
 * Adapted from
 * https://github.com/mui/material-ui/tree/v7.2.0/docs/data/material/getting-started/templates/checkout
 *
 * @author psarando
 */
import React from "react";

import { formatCurrency } from "@/utils/formatUtils";
import { CartInfo } from "@/contexts/cart";

import { List, ListItem, ListItemText, Typography } from "@mui/material";

export default function Info({ cartInfo }: { cartInfo: CartInfo }) {
    return (
        <React.Fragment>
            <Typography variant="subtitle2" sx={{ color: "text.secondary" }}>
                Total
            </Typography>
            <Typography variant="h4" gutterBottom>
                {formatCurrency(cartInfo.totalPrice || 0)}
            </Typography>
            <List disablePadding>
                {cartInfo.subscription && (
                    <ListItem
                        key={cartInfo.subscription.plan_name}
                        sx={{ py: 1, px: 0 }}
                    >
                        <ListItemText
                            sx={{ mr: 2 }}
                            primary={`${cartInfo.subscription.plan_name} Subscription`}
                            secondary={
                                cartInfo.subscription.periods === 1
                                    ? "1 Year"
                                    : "2 Years"
                            }
                        />
                        <Typography
                            variant="body1"
                            sx={{ fontWeight: "medium" }}
                        >
                            {formatCurrency(
                                (cartInfo.subscription.plan_rate || 0) *
                                    cartInfo.subscription.periods,
                            )}
                        </Typography>
                    </ListItem>
                )}
            </List>
        </React.Fragment>
    );
}

"use client";

/**
 * Adapted from
 * https://github.com/mui/material-ui/tree/v7.2.0/docs/data/material/getting-started/templates/checkout
 *
 * @author psarando
 */
import React from "react";

import { CartInfo } from "@/contexts/cart";
import { formatCurrency } from "@/utils/formatUtils";
import { addonProratedRate } from "@/utils/rates";

import { List, ListItem, ListItemText, Typography } from "@mui/material";

export default function Info({
    cartInfo,
    subscriptionEndDate,
}: {
    cartInfo: CartInfo;
    subscriptionEndDate?: number;
}) {
    return (
        <React.Fragment>
            <List disablePadding>
                <ListItem sx={{ py: 1, px: 0 }}>
                    <ListItemText
                        sx={{ mr: 2 }}
                        primary={
                            <Typography
                                variant="subtitle2"
                                sx={{ color: "text.secondary" }}
                            >
                                Total
                            </Typography>
                        }
                    />
                    <Typography variant="h4" gutterBottom>
                        {formatCurrency(cartInfo.totalPrice || 0)}
                    </Typography>
                </ListItem>
                {cartInfo.subscription && (
                    <CartInfoListItem
                        name={`${cartInfo.subscription.plan_name} Subscription`}
                        desc={
                            cartInfo.subscription.periods === 1
                                ? "1 Year"
                                : "2 Years"
                        }
                        price={
                            (cartInfo.subscription.plan_rate || 0) *
                            cartInfo.subscription.periods
                        }
                    />
                )}
                {cartInfo.addons &&
                    cartInfo.addons.map((addon) => (
                        <CartInfoListItem
                            key={addon.uuid}
                            name={`Add-on ${addon.name}`}
                            desc={`${addon.amount} x ${formatCurrency(
                                addon.addon_rates[0].rate,
                            )} prorated to the current subscription expiration date.`}
                            price={
                                addonProratedRate(subscriptionEndDate, addon) *
                                addon.amount
                            }
                        />
                    ))}
            </List>
        </React.Fragment>
    );
}

function CartInfoListItem({
    name,
    desc,
    price,
}: {
    name: string;
    desc: string;
    price: number;
}) {
    return (
        <ListItem sx={{ py: 1, px: 0 }}>
            <ListItemText sx={{ mr: 2 }} primary={name} secondary={desc} />
            <Typography variant="body1" sx={{ fontWeight: "medium" }}>
                {formatCurrency(price)}
            </Typography>
        </ListItem>
    );
}

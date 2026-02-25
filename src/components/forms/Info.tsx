"use client";

/**
 * Adapted from
 * https://github.com/mui/material-ui/tree/v7.2.0/docs/data/material/getting-started/templates/checkout
 *
 * @author psarando
 */
import React from "react";

import { SubscriptionSummaryDetails } from "@/app/api/types";
import { useCartInfo } from "@/contexts/cart";
import DeleteButton from "@/components/common/DeleteButton";
import { formatCurrency } from "@/utils/formatUtils";
import { addonProratedRate } from "@/utils/rates";

import { List, ListItem, ListItemText, Typography } from "@mui/material";

export default function Info({
    subscription,
}: {
    subscription?: SubscriptionSummaryDetails;
}) {
    const [cartInfo, setCartInfo] = useCartInfo();

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
                        onDelete={() => {
                            const { subscription: _, ...newCartInfo } =
                                cartInfo;
                            setCartInfo(newCartInfo);
                        }}
                    />
                )}
                {cartInfo.addons &&
                    cartInfo.addons.map((addon) => (
                        <CartInfoListItem
                            key={addon.uuid}
                            name={`Add-on ${addon.name}`}
                            desc={[
                                addon.quantity,
                                "x",
                                formatCurrency(addon.addon_rates[0].rate),
                                !(
                                    addon.resource_type.consumable ||
                                    addon.resource_type.name === "cpu.hours"
                                )
                                    ? "prorated to the subscription expiration date."
                                    : null,
                            ].join(" ")}
                            price={
                                addonProratedRate(
                                    subscription,
                                    cartInfo.subscription?.periods,
                                    addon,
                                ) * addon.quantity
                            }
                            onDelete={() => {
                                setCartInfo({
                                    ...cartInfo,
                                    addons: cartInfo.addons?.filter(
                                        (a) => a.uuid !== addon.uuid,
                                    ),
                                });
                            }}
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
    onDelete,
}: {
    name: string;
    desc: string;
    price: number;
    onDelete: React.MouseEventHandler<HTMLButtonElement>;
}) {
    return (
        <ListItem sx={{ py: 1, px: 0 }}>
            <DeleteButton
                component="IconButton"
                edge="start"
                sx={{ "&:hover": { color: "error.main" } }}
                onClick={onDelete}
            />
            <ListItemText sx={{ mr: 2 }} primary={name} secondary={desc} />
            <Typography variant="body1" sx={{ fontWeight: "medium" }}>
                {formatCurrency(price)}
            </Typography>
        </ListItem>
    );
}

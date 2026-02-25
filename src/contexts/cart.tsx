/**
 * A context to provide shopping cart information.
 *
 * @author psarando
 */
import React from "react";

import {
    getResourceUsageSummary,
    RESOURCE_USAGE_QUERY_KEY,
} from "@/app/api/serviceFacade";
import {
    OrderUpdateResult,
    ResourceUsageSummary,
    SubscriptionSubmission,
} from "@/app/api/types";
import { AddonsFormValues } from "@/components/forms/formatters";
import { getCartTotalPrice } from "@/utils/rates";

import { useQuery } from "@tanstack/react-query";

export type CartInfo = {
    subscription?: SubscriptionSubmission;
    addons?: AddonsFormValues["addons"];
    totalPrice?: number;
    order?: OrderUpdateResult;
};

// `setCartInfo` type (`totalPrice` is calculated by the Provider).
type NewCartInfo = Omit<CartInfo, "totalPrice">;

const CartInfoContext = React.createContext<
    [CartInfo, React.Dispatch<NewCartInfo>] | null
>(null);

export function useCartInfo() {
    const context = React.useContext(CartInfoContext);

    if (!context) {
        throw new Error("useCartInfo must be used within a CartInfoProvider");
    }

    return context;
}

export function CartInfoProvider(props: object) {
    const { data: resourceUsageSummary } = useQuery<ResourceUsageSummary>({
        queryKey: [RESOURCE_USAGE_QUERY_KEY],
        queryFn: getResourceUsageSummary,
    });

    const currentSubscription = resourceUsageSummary?.subscription;

    const reducer = React.useCallback(
        (_prev: CartInfo, newCartInfo: NewCartInfo): CartInfo => ({
            ...newCartInfo,
            totalPrice: getCartTotalPrice(newCartInfo, currentSubscription),
        }),
        [currentSubscription],
    );

    const value = React.useReducer(reducer, {});

    return <CartInfoContext.Provider value={value} {...props} />;
}

/**
 * A context to provide shopping cart information.
 *
 * @author psarando
 */
import React from "react";

import { OrderUpdateResult, SubscriptionSubmission } from "@/app/api/types";
import { AddonsFormValues } from "@/components/forms/formatters";

export type CartInfo = {
    subscription?: SubscriptionSubmission;
    addons?: AddonsFormValues["addons"];
    totalPrice?: number;
    order?: OrderUpdateResult;
};

const CartInfoContext = React.createContext<
    [CartInfo, React.Dispatch<React.SetStateAction<CartInfo>>] | null
>(null);

export function useCartInfo() {
    const context = React.useContext(CartInfoContext);

    if (!context) {
        throw new Error("useCartInfo must be used within a CartInfoProvider");
    }

    return context;
}

export function CartInfoProvider(props: object) {
    const value = React.useState<CartInfo>({});

    return <CartInfoContext.Provider value={value} {...props} />;
}

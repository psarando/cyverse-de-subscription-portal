/**
 * A context to provide shopping cart information.
 *
 * @author psarando
 */
import React from "react";

import { SubscriptionSubmission } from "@/app/api/serviceFacade";

export type CartInfo = {
    subscription?: SubscriptionSubmission;
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

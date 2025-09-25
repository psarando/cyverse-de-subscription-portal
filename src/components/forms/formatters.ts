import {
    AddonsList,
    AddonsType,
    OrderRequest,
    SubscriptionSubmission,
    SubscriptionSummaryDetails,
} from "@/app/api/types";
import { CartInfo } from "@/contexts/cart";
import { dateConstants, formatDate } from "@/utils/formatUtils";

export type SubscriptionFormValues = {
    plan_name: string;
    periods: number;
};

export function mapSubscriptionPropsToValues(
    subscription: SubscriptionSummaryDetails | undefined,
    cartInfo: CartInfo,
): SubscriptionFormValues {
    return {
        periods: cartInfo.subscription?.periods || 1,
        plan_name:
            cartInfo.subscription?.plan_name || subscription?.plan.name || "",
    };
}

export function formatSubscription(
    values: SubscriptionFormValues,
    subscription: SubscriptionSummaryDetails,
) {
    const { periods, plan_name } = values;

    const {
        users: { username },
        effective_end_date,
    } = subscription;

    const currentEndDate = new Date(effective_end_date);

    const submission: SubscriptionSubmission = {
        username,
        plan_name,
        paid: true,
        periods,
    };

    if (currentEndDate > new Date()) {
        submission.start_date = formatDate(
            currentEndDate,
            dateConstants.ISO_8601,
        );
    }

    return submission;
}

export type AddonsFormValues = {
    addons?: Array<AddonsType & { amount: number }>;
};

export function mapAddonsPropsToValues(
    addons?: AddonsList["addons"],
    cartInfo?: CartInfo,
): AddonsFormValues {
    return {
        addons: addons?.map((addon) => ({
            amount:
                cartInfo?.addons?.find((a) => a.uuid === addon.uuid)?.amount ||
                0,
            ...addon,
        })),
    };
}

export type CheckoutFormValues = Pick<
    OrderRequest,
    "termsAcknowledged" | "billTo" | "payment"
>;

export function formatCheckoutFormValues(): CheckoutFormValues {
    return {
        termsAcknowledged: false,
        billTo: {
            firstName: "",
            lastName: "",
            company: "",
            address: "",
            city: "",
            state: "",
            zip: "",
            country: "US",
        },
        payment: {
            creditCard: {
                cardNumber: "",
                expirationDate: "",
                cardCode: "",
            },
        },
    };
}

export function formatCheckoutTransactionRequest(
    username: string,
    cartInfo: CartInfo,
    values: CheckoutFormValues,
): OrderRequest {
    const { subscription } = cartInfo;

    const request: OrderRequest = {
        ...values,
        amount: cartInfo.totalPrice || 0,
        currencyCode: "USD",
        lineItems: [],
    };

    if (subscription) {
        request.lineItems?.push({
            lineItem: {
                itemId: "subscription",
                name: subscription.plan_name,
                description:
                    `${subscription.periods}-year Subscription for user "${username}".`.substring(
                        0,
                        255,
                    ),
                quantity: subscription.periods,
                unitPrice: subscription.plan_rate || 0,
            },
        });
    }

    return request;
}

import {
    SubscriptionSubmission,
    SubscriptionSummaryDetails,
    TransactionRequest,
} from "@/app/api/serviceFacade";
import { CartInfo } from "@/contexts/cart";
import { dateConstants, formatDate } from "@/utils/formatUtils";

export type SubscriptionFormValues = {
    plan_name: string;
    periods: number;
};

export function mapSubscriptionPropsToValues(
    subscription: SubscriptionSummaryDetails,
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

export type CheckoutFormValues = Pick<TransactionRequest, "billTo" | "payment">;

export function formatCheckoutFormValues(): CheckoutFormValues {
    return {
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
): TransactionRequest {
    const { subscription } = cartInfo;
    const {
        payment: { creditCard },
    } = values;
    const { cardNumber } = creditCard;

    const request: TransactionRequest = {
        ...values,
        amount: cartInfo.totalPrice?.toString() || "0",
        currencyCode: "USD",
        payment: {
            creditCard: {
                ...creditCard,
                cardNumber: cardNumber.replaceAll(" ", ""),
            },
        },
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
                quantity: subscription.periods.toString(),
                unitPrice: subscription.plan_rate?.toString() || "0",
            },
        });
    }

    return request;
}

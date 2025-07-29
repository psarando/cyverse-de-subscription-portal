import {
    SubscriptionSubmission,
    SubscriptionSummaryDetails,
} from "@/app/api/serviceFacade";
import { dateConstants, formatDate } from "@/utils/formatUtils";

export type SubscriptionFormValues = {
    plan_name: string;
    periods: number;
};

export function mapSubscriptionPropsToValues(
    subscription: SubscriptionSummaryDetails,
): SubscriptionFormValues {
    return {
        periods: 1,
        plan_name: subscription?.plan.name || "",
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

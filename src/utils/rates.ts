/**
 * @author psarando
 */
import constants from "@/constants";
import {
    AddonsType,
    SubscriptionSubmission,
    SubscriptionSummaryDetails,
} from "@/app/api/types";
import { addYears, differenceInCalendarDays } from "date-fns";

export const addonProratedRate = (
    subscription?: SubscriptionSummaryDetails,
    cartSubscriptionPeriods?: SubscriptionSubmission["periods"],
    addon?: AddonsType,
) => {
    let prorateDaysRemaining = 0;

    const subscriptionEndDate =
        subscription?.plan.name === constants.PLAN_NAME_BASIC &&
        cartSubscriptionPeriods
            ? addYears(new Date(), cartSubscriptionPeriods)
            : subscription?.effective_end_date;

    if (subscriptionEndDate) {
        prorateDaysRemaining =
            differenceInCalendarDays(subscriptionEndDate, new Date()) / 365;
    }

    if (prorateDaysRemaining && addon) {
        const addonRate = addon.addon_rates[0].rate;

        // Do not prorate consumable addons.
        // There is currently a bug where the backend is returning `cpu.hours`
        // types as not consumable.
        if (
            addon.resource_type.name === "cpu.hours" ||
            addon.resource_type.consumable
        ) {
            return addonRate;
        }

        const prorateAddonPrice = Math.round(addonRate * prorateDaysRemaining);

        return Math.max(prorateAddonPrice, 1);
    }

    return 0;
};

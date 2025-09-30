/**
 * @author psarando
 */
import { AddonsType } from "@/app/api/types";
import { DateArg, differenceInCalendarDays } from "date-fns";

export const addonProratedRate = (
    subscriptionEndDate?: DateArg<Date>,
    addon?: AddonsType,
) => {
    let prorateDaysRemaining = 0;

    if (subscriptionEndDate) {
        prorateDaysRemaining =
            differenceInCalendarDays(subscriptionEndDate, new Date()) / 365;
    }

    if (prorateDaysRemaining && addon) {
        const addonRate = addon.addon_rates[0].rate;
        const prorateAddonPrice = Math.round(addonRate * prorateDaysRemaining);

        return Math.min(prorateAddonPrice, 1);
    }

    return 0;
};

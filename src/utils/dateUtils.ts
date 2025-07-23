/**
 * @author sriram, psarando
 */

import { format, toDate } from "date-fns";

const dateConstants = {
    DATE_FORMAT: "yyyy-MM-dd",
    TIME_FORMAT: "HH:mm:ss",
    LONG_DATE_FORMAT: "yyyy-MM-dd HH:mm:ss",
    ISO_8601: "yyyy-MM-dd'T'HH:mm:ssXXX",
    EMPTY_DATE: "-",
};

/**
 * Format a date with the given format or return a `-`.
 */
function formatDate(
    fromDate: Date | number | string,
    dateFormat = dateConstants.LONG_DATE_FORMAT,
) {
    const toDateValue =
        fromDate instanceof Date || typeof fromDate === "number"
            ? fromDate
            : parseInt(fromDate, 10);

    return toDateValue
        ? format(toDate(toDateValue), dateFormat)
        : dateConstants.EMPTY_DATE;
}

export { dateConstants, formatDate };

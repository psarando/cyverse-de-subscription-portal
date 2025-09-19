import { SubscriptionSummaryDetails } from "@/app/api/types";
import { formatFileSize } from "@/utils/formatUtils";

import { Typography } from "@mui/material";

export const FormattedQuota = ({
    quota,
    resourceUnit,
}: {
    quota: number;
    resourceUnit: string;
}) => {
    // Only format data storage resources to human readable format
    const resourceInBytes = resourceUnit.toLowerCase() === "bytes";

    return (
        <Typography>
            {resourceInBytes
                ? formatFileSize(quota)
                : `${quota} ${resourceUnit} `}
        </Typography>
    );
};

const QuotaDetails = ({
    subscription,
}: {
    subscription: SubscriptionSummaryDetails | undefined;
}) => {
    return (
        <>
            {subscription &&
                subscription.quotas.length > 0 &&
                subscription.quotas.map((item) => (
                    <FormattedQuota
                        key={item.id}
                        quota={item.quota}
                        resourceUnit={item.resource_type.description}
                    />
                ))}
        </>
    );
};

export default QuotaDetails;

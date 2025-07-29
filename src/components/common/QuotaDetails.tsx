import { SubscriptionSummaryDetails } from "@/app/api/serviceFacade";
import { formatFileSize } from "@/utils/formatUtils";

import { Typography } from "@mui/material";

const QuotaDetails = ({
    subscription,
}: {
    subscription: SubscriptionSummaryDetails;
}) => {
    return (
        <>
            {subscription &&
                subscription.quotas.length > 0 &&
                subscription.quotas.map((item) => {
                    // Only format data storage resources to human readable format
                    const resourceInBytes =
                        item.resource_type.description.toLowerCase() ===
                        "bytes";

                    return (
                        <Typography key={item.id}>
                            {resourceInBytes
                                ? formatFileSize(item.quota)
                                : `${item.quota} ${item.resource_type.description} `}
                        </Typography>
                    );
                })}
        </>
    );
};

export default QuotaDetails;

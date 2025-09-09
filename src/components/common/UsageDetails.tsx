import { SubscriptionSummaryDetails } from "@/app/api/serviceFacade";
import { formatFileSize, formatUsage } from "@/utils/formatUtils";

import { Typography } from "@mui/material";

const UsageDetails = ({
    subscription,
}: {
    subscription: SubscriptionSummaryDetails | undefined;
}) => {
    return (
        <>
            {subscription &&
                subscription.usages.length > 0 &&
                subscription.usages.map((item) => {
                    // Format usage to readable format
                    const resourceInBytes =
                        item.resource_type.description.toLowerCase() ===
                        "bytes";

                    return (
                        <Typography key={item.id}>
                            {resourceInBytes
                                ? formatFileSize(item.usage)
                                : `${formatUsage(item.usage)} ${item.resource_type.description}`}
                        </Typography>
                    );
                })}

            {subscription && !subscription.usages.length && (
                <Typography>No Usages</Typography>
            )}
        </>
    );
};

export default UsageDetails;

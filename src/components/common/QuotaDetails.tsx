import { SubscriptionSummaryDetails } from "@/app/api/types";
import { formatQuota } from "@/utils/formatUtils";

import { Typography } from "@mui/material";

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
                    <Typography key={item.id}>
                        {formatQuota(
                            item.quota,
                            item.resource_type.description,
                        )}
                    </Typography>
                ))}
        </>
    );
};

export default QuotaDetails;

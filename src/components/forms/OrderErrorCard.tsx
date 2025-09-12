import type { OrderError } from "@/app/api/types";

import {
    Card,
    CardContent,
    CardHeader,
    Divider,
    Typography,
} from "@mui/material";
import ErrorIcon from "@mui/icons-material/Error";
import { formatCurrency } from "@/utils/formatUtils";

const OrderErrorCard = ({ orderError }: { orderError: OrderError }) => {
    const transactionErrors = orderError?.transactionResponse?.errors;

    const avatar = <ErrorIcon fontSize="large" color="error" />;
    const headerTitle = transactionErrors ? (
        transactionErrors.map((error, index) => (
            <Typography key={index} color="error" gutterBottom>
                {error.errorText}
            </Typography>
        ))
    ) : orderError.error_code === "ERR_CONFLICT" ? (
        <Typography color="error" gutterBottom>
            Prices in your cart have changed
        </Typography>
    ) : orderError.message || orderError.reason ? (
        <Typography color="error" gutterBottom>
            {orderError.message || orderError.reason}
        </Typography>
    ) : (
        <Typography color="error" gutterBottom>
            There was an error processing your order.
        </Typography>
    );

    return (
        <Card>
            <CardHeader avatar={avatar} title={headerTitle} />
            {orderError.currentPricing?.subscription && (
                <>
                    <Divider />
                    <CardContent>
                        <Typography>
                            {orderError.currentPricing.subscription.name}{" "}
                            Subscription Current Price:{" "}
                            {formatCurrency(
                                orderError.currentPricing.subscription.rate,
                            )}
                        </Typography>
                        <Typography variant="subtitle2" gutterBottom>
                            Please update your cart and try again.
                        </Typography>
                    </CardContent>
                </>
            )}
        </Card>
    );
};

export default OrderErrorCard;

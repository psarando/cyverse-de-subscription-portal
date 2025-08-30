/**
 * A typography that displays an error message with a button to view details.
 *
 * @author sriram, psarando
 */
import React from "react";

import { Button, Typography, TypographyProps, useTheme } from "@mui/material";

function ErrorTypography({
    errorMessage,
    onDetailsClick,
    variant = "caption",
}: {
    errorMessage: React.ReactNode;
    onDetailsClick?: () => void;
    variant?: TypographyProps["variant"];
}) {
    const theme = useTheme();

    return (
        <Typography color="error" variant={variant}>
            {errorMessage}
            {onDetailsClick && (
                <Button
                    variant="outlined"
                    onClick={onDetailsClick}
                    style={{ marginLeft: theme.spacing(1) }}
                    size="small"
                >
                    <Typography color="error" variant="caption">
                        View Details
                    </Typography>
                </Button>
            )}
        </Typography>
    );
}

export default ErrorTypography;

/**
 * A wrapper component to display an ErrorTypography and a DEErrorDialog. A custom error handler can be injected to the dialog.
 *
 * @author psarando
 */
import React from "react";

import ErrorTypography from "./ErrorTypography";
import DEErrorDialog from "./DEErrorDialog";
import { TypographyProps } from "@mui/material";

const ErrorTypographyWithDialog = ({
    errorMessage,
    errorObject,
    variant,
}: {
    errorMessage: React.ReactNode;
    errorObject?: object;
    variant?: TypographyProps["variant"];
}) => {
    const [errorDialogOpen, setErrorDialogOpen] = React.useState(false);

    return (
        <>
            <ErrorTypography
                errorMessage={errorMessage}
                onDetailsClick={() => setErrorDialogOpen(true)}
                variant={variant}
            />
            <DEErrorDialog
                open={errorDialogOpen}
                errorObject={errorObject}
                handleClose={() => {
                    setErrorDialogOpen(false);
                }}
            />
        </>
    );
};

export default ErrorTypographyWithDialog;

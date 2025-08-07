/**
 * @author sriram, psarando
 */

import React from "react";

import {
    BOTTOM,
    ERROR,
    LEFT,
    SUCCESS,
    TIMEOUT,
    WARNING,
} from "./AnnouncerConstants";

import {
    Alert,
    AlertProps,
    IconButton,
    Snackbar,
    SnackbarOrigin,
    SnackbarProps,
    Theme,
    useTheme,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";

function getTextColor(theme: Theme, severity?: string) {
    let color;
    switch (severity) {
        case ERROR:
            color = theme.palette.error.contrastText;
            break;
        case SUCCESS:
            color = theme.palette.success.contrastText;
            break;
        case WARNING:
            color = theme.palette.warning.contrastText;
            break;
        default:
            color = theme.palette.info.contrastText;
    }

    return color;
}

type SnackbarContentProps = {
    message?: React.ReactNode;
    onClose?: AlertProps["onClose"];
    variant: AlertProps["severity"];
    action?: AlertProps["action"];
};

const MySnackbarContent = React.forwardRef<
    HTMLDivElement,
    SnackbarContentProps
>(function MySnackbarContent(props: SnackbarContentProps, ref) {
    const { message, onClose, variant: severity, action } = props;
    const theme = useTheme();

    return (
        <Alert
            elevation={6}
            ref={ref}
            variant="filled"
            severity={severity}
            onClose={onClose}
            action={action}
            style={{ color: getTextColor(theme, severity) }}
        >
            {message}
        </Alert>
    );
});

function Announcer(props: {
    open: boolean;
    message?: React.ReactNode;
    variant: AlertProps["severity"];
    duration?: SnackbarProps["autoHideDuration"];
    vertical?: SnackbarOrigin["vertical"];
    horizontal?: SnackbarOrigin["horizontal"];
    onClose?: () => void;
    CustomAction?: React.JSXElementConstructor<unknown>;
}) {
    const {
        message,
        variant,
        duration,
        horizontal,
        vertical,
        onClose,
        open,
        CustomAction,
    } = props;

    const theme = useTheme();

    if (!message) {
        return null;
    }

    return (
        <Snackbar
            anchorOrigin={{
                vertical: vertical || BOTTOM,
                horizontal: horizontal || LEFT,
            }}
            open={open}
            autoHideDuration={duration || TIMEOUT}
            onClose={onClose}
            disableWindowBlurListener={true}
        >
            <MySnackbarContent
                onClose={onClose}
                variant={variant}
                message={message}
                action={[
                    CustomAction ? <CustomAction key="custom" /> : null,
                    <IconButton
                        key="close"
                        size="small"
                        sx={{ color: getTextColor(theme, variant) }}
                        aria-label="Close"
                        onClick={onClose}
                    >
                        <CloseIcon />
                    </IconButton>,
                ]}
            />
        </Snackbar>
    );
}

export default Announcer;

/**
 * A general purpose OK/Cancel confirmation dialog.
 *
 * @author psarando
 */
import React from "react";

import {
    Button,
    Dialog,
    DialogActions,
    DialogContent,
    DialogContentText,
    DialogTitle,
    useMediaQuery,
    useTheme,
} from "@mui/material";

function ConfirmationDialog(props: {
    open: boolean;
    onClose: () => void;
    onConfirm: () => void;
    confirmButtonText?: string;
    title: string;
    contentText: string;
}) {
    const { open, onClose, onConfirm, confirmButtonText, title, contentText } =
        props;

    const theme = useTheme();
    const fullScreen = useMediaQuery(theme.breakpoints.down("md"));

    return (
        <Dialog open={open} onClose={onClose} fullScreen={fullScreen}>
            <DialogTitle>{title}</DialogTitle>
            <DialogContent>
                <DialogContentText>{contentText}</DialogContentText>
            </DialogContent>
            <DialogActions>
                <Button onClick={onClose}>Cancel</Button>
                <Button onClick={onConfirm} color="primary" variant="contained">
                    {confirmButtonText || "OK"}
                </Button>
            </DialogActions>
        </Dialog>
    );
}

export default ConfirmationDialog;

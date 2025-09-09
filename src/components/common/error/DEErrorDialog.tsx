/**
 *  Wraps ErrorHandler in a Dialog
 *
 * @author sriram, psarando
 */
import React from "react";

import ErrorHandler from "./ErrorHandler";

import { Dialog, DialogContent, DialogTitle, IconButton } from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";

const DEErrorDialog = ({
    open,
    handleClose,
    errorObject,
}: {
    open: boolean;
    handleClose: React.MouseEventHandler;
    errorObject?: object;
}) => {
    return (
        <Dialog open={open} onClose={handleClose} scroll="body">
            <DialogTitle>
                <IconButton
                    aria-label="close"
                    sx={{
                        position: "absolute",
                        right: 1,
                        top: 1,
                        color: "error.main",
                        p: 1,
                    }}
                    onClick={handleClose}
                    size="large"
                >
                    <CloseIcon />
                </IconButton>
            </DialogTitle>
            <DialogContent>
                <ErrorHandler errorObject={errorObject} />
            </DialogContent>
        </Dialog>
    );
};

export default DEErrorDialog;

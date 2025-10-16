"use client";

/**
 * A button that uses the next/router to navigate back to the previous page in
 * the browser's history.
 *
 * @author psarando, sriram
 */
import React from "react";

import { useRouter } from "next/navigation";

import ConfirmationDialog from "@/components/common/ConfirmationDialog";

import {
    Button,
    ButtonProps,
    IconButton,
    useMediaQuery,
    useTheme,
} from "@mui/material";
import { ArrowBack } from "@mui/icons-material";

export default function BackButton({
    dirty = false,
    ...props
}: ButtonProps & { dirty?: boolean }) {
    const router = useRouter();
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

    const [showConfirmationDialog, setShowConfirmationDialog] =
        React.useState(false);

    const onClick = () => {
        if (dirty) {
            setShowConfirmationDialog(true);
        } else {
            goBack();
        }
    };

    const goBack = () => {
        if (router) {
            router.back();
        }
    };

    const BackBtn = isMobile ? (
        <IconButton
            color="primary"
            edge="start"
            aria-label="back"
            onClick={onClick}
            {...props}
            size="large"
        >
            <ArrowBack />
        </IconButton>
    ) : (
        <Button
            color="primary"
            variant={"contained"}
            size="small"
            startIcon={<ArrowBack fontSize="small" />}
            onClick={onClick}
            {...props}
        >
            Back
        </Button>
    );
    return (
        <>
            {BackBtn}
            <ConfirmationDialog
                open={showConfirmationDialog}
                title="Discard Changes?"
                contentText="You have unsaved changes."
                confirmButtonText="Discard"
                onConfirm={goBack}
                onClose={() => setShowConfirmationDialog(false)}
            />
        </>
    );
}

/**
 * A HOC to enable wrapped components to display an error announcer
 * by invoking the `showErrorAnnouncer` function (which is passed to them
 * as a prop). The error announcer has a button to open and display
 * an error dialog with error details.
 *
 * @author aramsey, sriram, psarando
 */
import React, { useCallback, useState } from "react";

import DEErrorDialog from "./DEErrorDialog";

import { announce } from "@/components/common/announcer/CyVerseAnnouncer";
import { ERROR } from "@/components/common/announcer/AnnouncerConstants";

import { Button, Typography } from "@mui/material";

export type WithErrorAnnouncerProps = {
    showErrorAnnouncer: (text: string, error: object) => void;
};

function withErrorAnnouncer<P>(
    WrappedComponent: React.ComponentType<P & WithErrorAnnouncerProps>,
) {
    const WithErrorAnnouncerComponent = (
        props: Omit<P, keyof WithErrorAnnouncerProps>,
    ) => {
        const [errorDialogOpen, setErrorDialogOpen] = useState(false);
        const [errorObject, setErrorObject] = useState<object>();

        const viewErrorDetails = useCallback(
            () => (
                <Button
                    variant="outlined"
                    onClick={() => setErrorDialogOpen(true)}
                >
                    <Typography
                        variant="button"
                        sx={{ color: "error.contrastText" }}
                    >
                        Details
                    </Typography>
                </Button>
            ),
            [],
        );

        const showErrorAnnouncer = useCallback(
            (text: string, error: object) => {
                setErrorObject(error);
                announce({
                    text,
                    variant: ERROR,
                    CustomAction: viewErrorDetails,
                });
            },
            [viewErrorDetails],
        );

        return (
            <>
                <WrappedComponent
                    {...(props as P)}
                    showErrorAnnouncer={showErrorAnnouncer}
                />
                <DEErrorDialog
                    open={errorDialogOpen}
                    errorObject={errorObject}
                    handleClose={() => {
                        setErrorDialogOpen(false);
                        setErrorObject(undefined);
                    }}
                />
            </>
        );
    };
    return WithErrorAnnouncerComponent;
}

export default withErrorAnnouncer;

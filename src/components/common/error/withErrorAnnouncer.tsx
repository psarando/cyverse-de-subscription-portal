/**
 * A HOC to enable wrapped components to display an error announcer
 * by invoking the `showErrorAnnouncer` function (which is passed to them
 * as a prop). The error announcer has a button to open and display
 * an error dialog with error details.
 *
 * Typescript types are based on the example given at
 * https://react-typescript-cheatsheet.netlify.app/docs/hoc/full_example/
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

function withErrorAnnouncer<
    T extends WithErrorAnnouncerProps = WithErrorAnnouncerProps,
>(WrappedComponent: React.ComponentType<T>) {
    // Create the inner component.
    const WithErrorAnnouncerComponent = (
        props: Omit<T, keyof WithErrorAnnouncerProps>,
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
                    {...(props as T)}
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

    // Try to create a nice displayName for React Dev Tools.
    const displayName =
        WrappedComponent.displayName || WrappedComponent.name || "Component";

    WithErrorAnnouncerComponent.displayName = `withErrorAnnouncer(${displayName})`;

    return WithErrorAnnouncerComponent;
}

export default withErrorAnnouncer;

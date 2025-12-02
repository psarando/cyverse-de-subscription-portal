/**
 * A commonly used button or icon button that displays a red trash can icon.
 *
 * @author aramsey, psarando
 */
import React from "react";

import { Delete } from "@mui/icons-material";
import {
    Button,
    ButtonProps,
    IconButton,
    IconButtonProps,
} from "@mui/material";

function DeleteButton(
    props: {
        ariaLabel?: string;
        component?: "Button" | "IconButton";
    } & Omit<ButtonProps, "component"> &
        Omit<IconButtonProps, "component">,
) {
    const { ariaLabel, component = "Button", children, ...rest } = props;

    const isButton = component === "Button";
    const Component: React.ElementType = isButton ? Button : IconButton;
    const showStartIcon = isButton && children;
    const showChildIcon = !isButton || !showStartIcon;

    return (
        <Component
            aria-label={ariaLabel || "delete"}
            sx={{ color: "error.main" }}
            {...(showStartIcon && { startIcon: <Delete /> })}
            {...rest}
        >
            {showChildIcon && <Delete />}
            {children}
        </Component>
    );
}

export default DeleteButton;

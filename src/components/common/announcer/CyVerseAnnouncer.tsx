/**
 * @author sriram, psarando
 */

import React, { useEffect } from "react";

import Announcer from "./Announcer";
import {
    BOTTOM,
    EMPTY_QUEUE_TIMEOUT,
    HorizontalAlignmentEnum,
    INFO,
    LEFT,
    TIMEOUT,
    VariantEnum,
    VerticalAlignmentEnum,
} from "./AnnouncerConstants";

import { SnackbarProps } from "@mui/material";

/**
 * A message with configuration.
 */
type QueueMessage = {
    /**
     * The message text.
     */
    text: string;

    /**
     * The message variant.
     * @default INFO
     */
    variant?: VariantEnum;

    /**
     * The message duration.
     * @default TIMEOUT
     */
    duration?: SnackbarProps["autoHideDuration"];

    /**
     * The message horizontal alignment.
     * @default LEFT
     */
    horizontal?: HorizontalAlignmentEnum;

    /**
     * The message vertical alignment.
     * @default BOTTOM
     */
    vertical?: VerticalAlignmentEnum;

    CustomAction?: React.JSXElementConstructor<unknown>;
};

const msgQueue: QueueMessage[] = [];

/**
 *  Queue messages needed to be announced using CyVerseAnnouncer
 */
export const announce = (msg: QueueMessage) => {
    msgQueue.push(msg);
};

const CyVerseAnnouncer = () => {
    const [msg, setMsg] = React.useState<QueueMessage | undefined>();
    const [open, setOpen] = React.useState(false);
    const [timeout, setTimeout] = React.useState(EMPTY_QUEUE_TIMEOUT);
    const intervalRef = React.useRef<NodeJS.Timeout>(null);

    const dequeue = React.useCallback(() => {
        if (msgQueue.length > 0) {
            const nextMsg = msgQueue.shift();
            setMsg(nextMsg);
            setOpen(true);
            setTimeout(
                msgQueue.length === 0
                    ? EMPTY_QUEUE_TIMEOUT
                    : nextMsg?.duration || TIMEOUT,
            );
        }
    }, []);

    useEffect(() => {
        clearInterval(intervalRef.current as NodeJS.Timeout);
        intervalRef.current = timeout ? setInterval(dequeue, timeout) : null;

        return () => clearInterval(intervalRef.current as NodeJS.Timeout);
    }, [timeout, dequeue]);

    const handleClose = () => {
        setOpen(false);
        setTimeout(EMPTY_QUEUE_TIMEOUT);
    };

    const { text, variant, duration, horizontal, vertical, CustomAction } =
        msg || {};

    return (
        <Announcer
            message={text}
            variant={variant || INFO}
            open={open}
            duration={duration || TIMEOUT}
            onClose={handleClose}
            horizontal={horizontal || LEFT}
            vertical={vertical || BOTTOM}
            CustomAction={CustomAction}
        />
    );
};

export default CyVerseAnnouncer;

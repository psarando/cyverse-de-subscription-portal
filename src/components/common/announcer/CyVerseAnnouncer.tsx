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
    const [timer, setTimer] = React.useState<NodeJS.Timeout>();
    const [msg, setMsg] = React.useState<QueueMessage | undefined>();
    const [open, setOpen] = React.useState(false);
    const [timeout, setTimeout] = React.useState(TIMEOUT);

    useEffect(() => {
        const timer = setInterval(tickCallback, TIMEOUT);
        //display first message right away
        dequeue();
        setTimer(timer);

        return () => {
            clearInterval(timer);
        };
    }, []);

    const dequeue = () => {
        if (msgQueue.length > 0) {
            setMsg(msgQueue.shift());
            setOpen(true);
            if (msgQueue.length === 0 && timeout !== EMPTY_QUEUE_TIMEOUT) {
                clearInterval(timer);
                const newTimer = setInterval(tickCallback, EMPTY_QUEUE_TIMEOUT);
                setTimer(newTimer);
                setTimeout(EMPTY_QUEUE_TIMEOUT);
            } else if (timeout !== TIMEOUT) {
                clearInterval(timer);
                const newTimer = setInterval(tickCallback, TIMEOUT);
                setTimer(newTimer);
                setTimeout(TIMEOUT);
            }
        }
    };

    const handleClose = () => {
        setOpen(false);
        tickCallback();
    };

    const tickCallback = () => {
        dequeue();
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

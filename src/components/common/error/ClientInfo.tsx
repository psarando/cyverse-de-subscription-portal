"use client";

/**
 * A component used to display details about the user and user agent that may
 * be helpful when troubleshooting errors.
 */
import GridLabelValue from "@/components/common/GridLabelValue";

import Bowser from "bowser";
import { useSession } from "next-auth/react";

import { Typography } from "@mui/material";

function ClientInfo() {
    const { data: session } = useSession();

    const browser = Bowser.getParser(window.navigator.userAgent);

    const { name: browserName, version: browserVersion } = browser.getBrowser();
    const {
        name: osName,
        version: osVersion,
        versionName: osVersionName,
    } = browser.getOS();

    return (
        <>
            <GridLabelValue label="User">
                <Typography>{session?.user?.username}</Typography>
            </GridLabelValue>
            <GridLabelValue label="Browser">
                <Typography>
                    {browserName} - {browserVersion}
                </Typography>
            </GridLabelValue>
            <GridLabelValue label="OS">
                <Typography>
                    {osName} - {osVersionName} - {osVersion}
                </Typography>
            </GridLabelValue>
            <GridLabelValue label="Host">
                <Typography>{window.location.origin}</Typography>
            </GridLabelValue>
            <GridLabelValue label="Timestamp">
                <Typography>{new Date().toString()}</Typography>
            </GridLabelValue>
        </>
    );
}

export default ClientInfo;

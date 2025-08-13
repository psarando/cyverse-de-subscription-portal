"use client";

/**
 * Adapted from
 * https://github.com/mui/material-ui/tree/v7.2.0/docs/data/material/getting-started/templates/checkout
 *
 * @author psarando
 */
import React from "react";

import { CartInfo } from "@/contexts/cart";

import Info from "./Info";

import { Box, Button, Drawer, IconButton } from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import ExpandMoreRoundedIcon from "@mui/icons-material/ExpandMoreRounded";

export default function InfoMobile({ cartInfo }: { cartInfo: CartInfo }) {
    const [open, setOpen] = React.useState(false);

    const toggleDrawer = (newOpen: boolean) => () => {
        setOpen(newOpen);
    };

    const DrawerList = (
        <Box sx={{ width: "auto", px: 3, pb: 3, pt: 8 }} role="presentation">
            <IconButton
                onClick={toggleDrawer(false)}
                sx={{ position: "absolute", right: 8, top: 8 }}
            >
                <CloseIcon />
            </IconButton>
            <Info cartInfo={cartInfo} />
        </Box>
    );

    return (
        <div>
            <Button
                variant="text"
                endIcon={<ExpandMoreRoundedIcon />}
                onClick={toggleDrawer(true)}
            >
                View details
            </Button>
            <Drawer
                open={open}
                anchor="top"
                onClose={toggleDrawer(false)}
                slotProps={{
                    paper: {
                        sx: {
                            // The AppBar height is 64px.
                            top: "var(--template-frame-height, 64px)",
                            backgroundImage: "none",
                            backgroundColor: "background.paper",
                        },
                    },
                }}
            >
                {DrawerList}
            </Drawer>
        </div>
    );
}

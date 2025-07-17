"use client";

import React from "react";

import { useSession, signIn, signOut } from "next-auth/react";

import constants from "@/constants";

import {
    Avatar,
    Button,
    Divider,
    Link,
    Paper,
    Popover,
    Stack,
    Tooltip,
    Typography,
} from "@mui/material";
import AccountCircle from "@mui/icons-material/AccountCircle";

const AccountAvatar = () => {
    const [anchorEl, setAnchorEl] = React.useState<HTMLDivElement | null>(null);

    const { data: session } = useSession();

    const userFirstInitial = session?.user?.name?.charAt(0).toUpperCase();

    React.useEffect(() => {
        if (session?.accessTokenExp) {
            // If the access token has expired, force a sign out for now.
            if (new Date(session.accessTokenExp * 1000) < new Date()) {
                signOut();
            }
        }
    }, [session]);

    const handleUserAvatarClick = (event: React.MouseEvent<HTMLDivElement>) => {
        if (!session) {
            signIn("keycloak");
        } else {
            setAnchorEl(event.currentTarget);
        }
    };

    return (
        <>
            <Tooltip title={session ? "Logout" : "Login"}>
                <Avatar
                    sx={{
                        backgroundColor: session
                            ? "success.main"
                            : "primary.main",
                    }}
                    onClick={handleUserAvatarClick}
                >
                    {session ? (
                        <Typography>{userFirstInitial}</Typography>
                    ) : (
                        <AccountCircle />
                    )}
                </Avatar>
            </Tooltip>
            <Popover
                open={!!anchorEl}
                anchorEl={anchorEl}
                onClose={() => {
                    setAnchorEl(null);
                }}
                anchorOrigin={{
                    vertical: "bottom",
                    horizontal: "center",
                }}
            >
                <Paper sx={{ padding: 1 }}>
                    <Stack
                        justifyContent="center"
                        alignItems="center"
                        spacing={1}
                    >
                        <Avatar
                            sx={{
                                backgroundColor: "success.main",
                            }}
                        >
                            <Typography>{userFirstInitial}</Typography>
                        </Avatar>

                        <Typography variant="caption">
                            {session?.user?.name}
                        </Typography>

                        <Typography variant="caption">
                            Username: {session?.user?.username}
                        </Typography>

                        <Typography variant="caption">
                            {session?.user?.email}
                        </Typography>

                        <Button
                            variant="outlined"
                            size="small"
                            onClick={() =>
                                window.open(
                                    constants.USER_PORTAL_URL,
                                    "_blank",
                                    "noopener",
                                )
                            }
                        >
                            Manage your CyVerse Account
                        </Button>

                        <Divider flexItem />

                        <Button
                            variant="outlined"
                            size="small"
                            onClick={() => signOut()}
                        >
                            Logout
                        </Button>

                        <Divider flexItem />

                        <Stack
                            direction="row"
                            spacing={1}
                            justifyContent="center"
                            alignItems="center"
                        >
                            <Link
                                href={constants.CYVERSE_POLICY_URL}
                                target="_blank"
                                underline="hover"
                            >
                                <Typography variant="caption">
                                    Policies
                                </Typography>
                            </Link>
                            <Typography variant="caption">•</Typography>
                            <Link
                                href={constants.CYVERSE_ABOUT_URL}
                                target="_blank"
                                underline="hover"
                            >
                                <Typography variant="caption">About</Typography>
                            </Link>
                        </Stack>
                    </Stack>
                </Paper>
            </Popover>
        </>
    );
};

export default AccountAvatar;

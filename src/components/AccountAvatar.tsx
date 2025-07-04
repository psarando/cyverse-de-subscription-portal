"use client";

import React from "react";

import { useSession, signIn } from "next-auth/react";
import { Avatar } from "@mui/material";
import AccountCircle from "@mui/icons-material/AccountCircle";

const AccountAvatar = () => {
    const { data: session } = useSession();

    const handleUserButtonClick = () => {
        if (!session) {
            signIn("keycloak");
        }
    };

    return (
        <Avatar
            alt={session?.user?.name || "User Avatar"}
            onClick={handleUserButtonClick}
        >
            {session ? (
                session?.user?.name?.charAt(0).toUpperCase()
            ) : (
                <AccountCircle />
            )}
        </Avatar>
    );
};

export default AccountAvatar;

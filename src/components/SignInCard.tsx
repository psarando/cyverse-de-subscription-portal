"use client";

import { useSession, signIn, signOut } from "next-auth/react";

import constants from "@/constants";
import ContactSupport from "@/components/common/ContactSupport";

import {
    Card,
    CardActions,
    CardContent,
    CardHeader,
    Divider,
    Link,
    Typography,
} from "@mui/material";
import ErrorIcon from "@mui/icons-material/Error";

const SignInCard = () => {
    const { data: session } = useSession();

    const title = session
        ? `Signed in as ${session.user?.email}`
        : "Sign In Required";

    const contents = session ? (
        <Link
            component="button"
            color="primary"
            underline="hover"
            onClick={() => signOut()}
        >
            <Typography variant="h6" sx={{ p: 1 }}>
                Sign Out
            </Typography>
        </Link>
    ) : (
        <>
            <Typography sx={{ p: 1 }}>
                You must sign in to perform this action.
                <Link
                    component="button"
                    color="primary"
                    underline="hover"
                    onClick={() => signIn("keycloak")}
                >
                    <Typography variant="h6" sx={{ p: 1 }}>
                        Sign In
                    </Typography>
                </Link>
            </Typography>
            <Typography sx={{ p: 1 }}>
                Need a free account?
                <Link
                    component="button"
                    color="primary"
                    underline="hover"
                    onClick={() =>
                        window.open(
                            constants.USER_PORTAL_REGISTER,
                            "_blank",
                            "noopener",
                        )
                    }
                >
                    <Typography variant="subtitle2" sx={{ p: 1 }}>
                        Register
                    </Typography>
                </Link>
            </Typography>
        </>
    );

    return (
        <Card>
            <CardHeader
                avatar={<ErrorIcon color="primary" fontSize="large" />}
                title={
                    <Typography component="span" variant="h6">
                        {title}
                    </Typography>
                }
            />
            <Divider />
            <CardContent sx={{ p: 2 }}>{contents}</CardContent>
            <Divider />
            <CardActions>
                <ContactSupport />
            </CardActions>
        </Card>
    );
};

export default SignInCard;

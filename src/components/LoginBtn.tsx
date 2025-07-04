"use client";

import { useSession, signIn, signOut } from "next-auth/react";
import Button from "@mui/material/Button";

const LoginBtn = () => {
    const { data: session } = useSession();

    return session ? (
        <div>
            Signed in as {session.user?.email} <br />
            <Button variant="contained" onClick={() => signOut()}>
                Sign out
            </Button>
        </div>
    ) : (
        <div>
            Not signed in <br />
            <Button variant="contained" onClick={() => signIn("keycloak")}>
                Sign in
            </Button>
        </div>
    );
};

export default LoginBtn;

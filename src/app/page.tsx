import { auth } from "@/auth";
import AccountAvatar from "@/components/AccountAvatar";
import SignInCard from "@/components/SignInCard";
import SubscriptionSummary from "@/components/SubscriptionSummary";

import Image from "next/image";
import {
    AppBar,
    Box,
    IconButton,
    Stack,
    Toolbar,
    Typography,
} from "@mui/material";

export default async function Home() {
    const session = await auth();

    return (
        <Box>
            <AppBar position="static">
                <Toolbar>
                    <Box sx={{ flexGrow: 1 }} />
                    <IconButton
                        size="large"
                        aria-label={
                            session
                                ? `${session?.user?.name} Account Menu`
                                : "Login"
                        }
                    >
                        <AccountAvatar />
                    </IconButton>
                </Toolbar>
            </AppBar>
            <main>
                <Stack spacing={2} sx={{ p: 2 }}>
                    <Image
                        src="/cyverse_logo_2.png"
                        alt="CyVerse logo"
                        width={375}
                        height={76}
                        priority
                    />
                    <Stack alignItems="center" spacing={2}>
                        {session ? (
                            <>
                                <Typography variant="h4">
                                    Welcome {session?.user?.name}!
                                </Typography>
                                <SubscriptionSummary />
                            </>
                        ) : (
                            <SignInCard />
                        )}
                    </Stack>
                </Stack>
            </main>
        </Box>
    );
}

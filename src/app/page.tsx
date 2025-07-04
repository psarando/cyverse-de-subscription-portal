import { auth } from "@/auth";
import LoginBtn from "@/components/LoginBtn";
import AccountAvatar from "@/components/AccountAvatar";

import Image from "next/image";
import { AppBar, Box, IconButton, Toolbar } from "@mui/material";

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
            <main className="flex flex-col gap-[32px] row-start-2 items-center sm:items-start">
                <Image
                    src="/cyverse_logo_2.png"
                    alt="CyVerse logo"
                    width={836}
                    height={170}
                    priority
                />
                <div className="flex gap-4 items-center flex-col">
                    Welcome {session?.user?.name}!
                    <LoginBtn />
                </div>
            </main>
        </Box>
    );
}

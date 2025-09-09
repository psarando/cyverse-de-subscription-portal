import type { Metadata } from "next";
import Image from "next/image";
import { AppBar, Box, Link, Stack, Toolbar, Tooltip } from "@mui/material";
import { AppRouterCacheProvider } from "@mui/material-nextjs/v15-appRouter";
import { Roboto } from "next/font/google";
import { ThemeProvider } from "@mui/material/styles";
import theme from "../theme";
import "./globals.css";

import { auth } from "@/auth";
import constants from "@/constants";
import AccountAvatar from "@/components/AccountAvatar";
import Cart from "@/components/Cart";
import SignInCard from "@/components/SignInCard";

import App from "./App";

const roboto = Roboto({
    weight: ["300", "400", "500", "700"],
    subsets: ["latin"],
    display: "swap",
    variable: "--font-roboto",
});

export const metadata: Metadata = {
    title: "CyVerse Subscription Portal",
    description: "CyVerse Discovery Environment Subscription Portal",
};

export default async function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    const session = await auth();

    return (
        <html lang="en" className={roboto.variable}>
            <body>
                <AppRouterCacheProvider>
                    <ThemeProvider theme={theme}>
                        <App>
                            <Box>
                                <AppBar position="static">
                                    <Toolbar>
                                        <Tooltip title="CyVerse Home Page">
                                            <Link
                                                href={
                                                    constants.CYVERSE_HOME_URL
                                                }
                                                target="_blank"
                                                rel="noopener"
                                                underline="hover"
                                            >
                                                <Image
                                                    src="/cyverse-logo-white.svg"
                                                    alt="CyVerse logo"
                                                    width={200}
                                                    height={40}
                                                    priority
                                                />
                                            </Link>
                                        </Tooltip>
                                        <Box sx={{ flexGrow: 1 }} />
                                        <Cart />
                                        <AccountAvatar />
                                    </Toolbar>
                                </AppBar>
                                <main>
                                    <Stack
                                        alignItems="center"
                                        spacing={2}
                                        sx={{ p: 2 }}
                                    >
                                        {session ? children : <SignInCard />}
                                    </Stack>
                                </main>
                            </Box>
                        </App>
                    </ThemeProvider>
                </AppRouterCacheProvider>
            </body>
        </html>
    );
}

import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import {
    AppBar,
    Box,
    Grid,
    Stack,
    Toolbar,
    Tooltip,
    Typography,
} from "@mui/material";
import { AppRouterCacheProvider } from "@mui/material-nextjs/v15-appRouter";
import { Roboto } from "next/font/google";
import { ThemeProvider } from "@mui/material/styles";
import theme from "../theme";
import "./globals.css";

import { auth } from "@/auth";
import constants from "@/constants";
import { maintenanceEnabled } from "@/db";
import AccountAvatar from "@/components/AccountAvatar";
import Cart from "@/components/Cart";
import SignInCard from "@/components/SignInCard";
import ExternalLink from "@/components/common/ExternalLink";

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
    const maintenance = await maintenanceEnabled();

    return (
        <html lang="en" className={roboto.variable}>
            <body>
                <AppRouterCacheProvider>
                    <ThemeProvider theme={theme}>
                        <App>
                            <Box>
                                <AppBar
                                    position="static"
                                    variant="outlined"
                                    elevation={0}
                                    color={maintenance ? "warning" : undefined}
                                    enableColorOnDark={maintenance}
                                >
                                    <Toolbar sx={{ mt: 1 }}>
                                        <Tooltip title="CyVerse Subscription Portal">
                                            <Link href="/">
                                                <Image
                                                    src="/cyverse-logo-white.svg"
                                                    alt="CyVerse logo"
                                                    width={200}
                                                    height={40}
                                                    priority
                                                />
                                                <Typography
                                                    sx={{
                                                        pl: 7,
                                                    }}
                                                >
                                                    Subscription Portal
                                                    {maintenance &&
                                                        " Maintenance Mode"}
                                                </Typography>
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

                                <Grid
                                    container
                                    component={"footer"}
                                    spacing={2}
                                    sx={{ p: 2 }}
                                    direction={"row"}
                                >
                                    <Tooltip
                                        title="CyVerse Home Page"
                                        placement="bottom-start"
                                    >
                                        <ExternalLink
                                            href={constants.CYVERSE_HOME_URL}
                                            rel="noopener"
                                        >
                                            <Image
                                                src="/cyverse_logo_2.png"
                                                alt="CyVerse logo"
                                                width={200}
                                                height={40}
                                                priority
                                            />
                                        </ExternalLink>
                                    </Tooltip>

                                    <Tooltip
                                        title="Discovery Environment Home"
                                        placement="bottom-start"
                                    >
                                        <ExternalLink
                                            href={constants.DE_LINK}
                                            rel="noopener"
                                        >
                                            <Image
                                                src="/de.png"
                                                alt="CyVerse Discovery Environment"
                                                width={190}
                                                height={40}
                                            />
                                        </ExternalLink>
                                    </Tooltip>
                                </Grid>
                            </Box>
                        </App>
                    </ThemeProvider>
                </AppRouterCacheProvider>
            </body>
        </html>
    );
}

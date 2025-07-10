"use client";

import palette from "@/components/theme/CyVersePalette";

import { createTheme } from "@mui/material/styles";

const theme = createTheme({
    colorSchemes: {
        dark: true,
    },
    cssVariables: {
        // Appears to prevent SSR flicker from light to dark mode during hydration phase.
        colorSchemeSelector: "media",
    },
    palette: {
        // All intentions should be defined with references to colors from the new palette.
        primary: {
            main: palette.cobalt,
        },
        secondary: {
            main: palette.sky,
        },
        error: {
            main: palette.alertRed,
        },
        warning: {
            main: palette.yellow,
        },
        info: {
            main: palette.blueGrey,
        },
        success: {
            main: palette.grass,
        },
        action: {
            hover: "rgba(0, 0, 0, 0.1)", // was 0.04
            hoverOpacity: 0.1,
            selected: "rgba(0, 0, 0, 0.2)", // was 0.08
            selectedOpacity: 0.2,
        },
    },
    typography: {
        fontFamily: "var(--font-roboto)",
        button: {
            textTransform: "none",
        },
    },
});

export default theme;

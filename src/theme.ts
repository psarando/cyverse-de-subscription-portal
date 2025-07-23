"use client";

import cyverse from "@/components/theme/CyVersePalette";

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
            main: cyverse.cobalt,
        },
        secondary: {
            main: cyverse.sky,
        },
        error: {
            main: cyverse.alertRed,
        },
        warning: {
            main: cyverse.yellow,
        },
        info: {
            main: cyverse.blueGrey,
        },
        success: {
            main: cyverse.grass,
        },
        action: {
            hover: "rgba(0, 0, 0, 0.1)", // was 0.04
            hoverOpacity: 0.1,
            selected: "rgba(0, 0, 0, 0.2)", // was 0.08
            selectedOpacity: 0.2,
        },

        // Allow CyVersePalette colors to be referenced in the palette.
        cyverse,
    },
    typography: {
        fontFamily: "var(--font-roboto)",
        button: {
            textTransform: "none",
        },
    },
});

// Allow CyVersePalette colors to be referenced in the palette.
declare module "@mui/material/styles" {
    interface Palette {
        cyverse: typeof cyverse;
    }

    interface PaletteOptions {
        cyverse?: typeof cyverse;
    }
}

export default theme;

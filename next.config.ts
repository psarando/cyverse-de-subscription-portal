import { NextConfig } from "next";
import { PHASE_PRODUCTION_BUILD } from "next/constants";

// appConfiguration defines the supported configuration settings for the application.
const appConfiguration = {
    authorizeNetLoginId: {
        variable: "SP_AUTHORIZE_NET_LOGIN_ID",
        required: true,
        isPublic: false,
    },
    authorizeNetTransactionKey: {
        variable: "SP_AUTHORIZE_NET_TRANSACTION_KEY",
        required: true,
        isPublic: false,
    },
    authorizeNetApiEndpoint: {
        variable: "SP_AUTHORIZE_NET_API_ENDPOINT",
        required: true,
        isPublic: false,
    },
    authorizeNetTestRequests: {
        variable: "SP_AUTHORIZE_NET_TEST_REQUESTS",
        required: false,
        isPublic: false,
        defaultValue: "false",
    },
    keycloakIssuer: {
        variable: "SP_KEYCLOAK_ISSUER",
        required: true,
        isPublic: false,
    },
    keycloakClientId: {
        variable: "SP_KEYCLOAK_CLIENT_ID",
        required: true,
        isPublic: false,
    },
    keycloakClientSecret: {
        variable: "SP_KEYCLOAK_CLIENT_SECRET",
        required: true,
        isPublic: false,
    },
    terrainBaseUrl: {
        variable: "SP_TERRAIN_BASE_URL",
        required: false,
        isPublic: true,
        defaultValue: "https://de.cyverse.org/terrain",
    },
    supportEmail: {
        variable: "SP_CYVERSE_SUPPORT_EMAIL",
        required: false,
        isPublic: false,
        defaultValue: "support@cyverse.org",
    },
    dbDatabase: {
        variable: "DB_DATABASE",
        required: true,
        isPublic: false,
    },
    dbUser: {
        variable: "DB_USER",
        required: true,
        isPublic: false,
    },
    dbPassword: {
        variable: "DB_PASSWORD",
        required: true,
        isPublic: false,
    },
    dbHost: {
        variable: "DB_HOST",
        required: true,
        isPublic: false,
    },
    dbPort: {
        variable: "DB_PORT",
        required: true,
        isPublic: false,
    },
    dbTimeout: {
        variable: "DB_TIMEOUT",
        required: false,
        isPublic: false,
        defaultValue: "20000", // 20 seconds, in milliseconds
    },
} as Record<
    string,
    {
        variable: string;
        required: boolean;
        isPublic: boolean;
        defaultValue?: string;
    }
>;

// loadConfig loads the runtime configuration from the environment based on the definitions in `appConfiguration`.
function loadConfig(phase: string) {
    let configurationError = false;
    const publicRuntimeConfig: Record<string, string | undefined> = {};
    const serverRuntimeConfig: Record<string, string | undefined> = {};

    if (phase !== PHASE_PRODUCTION_BUILD) {
        for (const [
            key,
            { variable, required, isPublic, defaultValue },
        ] of Object.entries(appConfiguration)) {
            const defined =
                variable in process.env ||
                typeof process.env[variable] !== "undefined";

            // Log an error if a required configuration setting isn't defined.
            if (required && !defined) {
                console.log(
                    `configuration error [${key}]: ${variable} is not defined`,
                );
                configurationError = true;
                continue;
            }

            // Get the value of the configuration setting.
            const value = defined ? process.env[variable] : defaultValue;

            // Store the configuration setting.
            if (isPublic) {
                publicRuntimeConfig[key] = value;
            } else {
                serverRuntimeConfig[key] = value;
            }
        }
    }

    return { configurationError, publicRuntimeConfig, serverRuntimeConfig };
}

// init initializes the application and exits if an initialization error is encountered.
function init(phase: string) {
    const { configurationError, publicRuntimeConfig, serverRuntimeConfig } =
        loadConfig(phase);
    if (configurationError) {
        process.exit(1);
    }

    return {
        publicRuntimeConfig,
        serverRuntimeConfig,
        // Full URL logging to the console when running in dev mode.
        logging: { fetches: { fullUrl: true } },
    } as NextConfig;
}

export default init;

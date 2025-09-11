import { PHASE_PRODUCTION_BUILD } from "next/constants";

// appConfiguration defines the supported configuration settings for the application.
const appConfiguration = {
    authorizeNetLoginId: {
        variable: "SP_AUTHORIZE_NET_LOGIN_ID",
        required: true,
        isPublic: false,
        defaultValue: undefined,
    },
    authorizeNetTransactionKey: {
        variable: "SP_AUTHORIZE_NET_TRANSACTION_KEY",
        required: true,
        isPublic: false,
        defaultValue: undefined,
    },
    authorizeNetApiEndpoint: {
        variable: "SP_AUTHORIZE_NET_API_ENDPOINT",
        required: true,
        isPublic: false,
        defaultValue: undefined,
    },
    keycloakIssuer: {
        variable: "SP_KEYCLOAK_ISSUER",
        required: true,
        isPublic: false,
        defaultValue: undefined,
    },
    keycloakClientId: {
        variable: "SP_KEYCLOAK_CLIENT_ID",
        required: true,
        isPublic: false,
        defaultValue: undefined,
    },
    keycloakClientSecret: {
        variable: "SP_KEYCLOAK_CLIENT_SECRET",
        required: true,
        isPublic: false,
        defaultValue: undefined,
    },
    terrainBaseUrl: {
        variable: "SP_TERRAIN_BASE_URL",
        required: false,
        isPublic: true,
        defaultValue: "https://de.cyverse.org/terrain",
    },
};

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
    const { configurationError, publicRuntimeConfig, serverRuntimeConfig } = loadConfig(phase)
    if (configurationError) {
        process.exit(1)
    }

    return {
        publicRuntimeConfig,
        serverRuntimeConfig,
        logging: { fetches: { fullUrl: true } },
    }
}

export default init;

import logger from "@/logging";
import { NextConfig } from "next";
import { PHASE_PRODUCTION_BUILD } from "next/constants";

// requiredEnvVars defines the required configuration settings for the application.
const requiredEnvVars = [
    "SP_AUTHORIZE_NET_LOGIN_ID",
    "SP_AUTHORIZE_NET_TRANSACTION_KEY",
    "SP_AUTHORIZE_NET_SIGNATURE_KEY",
    "SP_AUTHORIZE_NET_API_ENDPOINT",
    "SP_AUTHORIZE_NET_HOSTED_ENDPOINT",
    "SP_KEYCLOAK_ISSUER",
    "SP_KEYCLOAK_CLIENT_ID",
    "SP_KEYCLOAK_CLIENT_SECRET",
    "SP_BASE_URL",
    "SP_TERRAIN_BASE_URL",
    "SP_CYVERSE_SUPPORT_EMAIL",
    "DB_DATABASE",
    "DB_USER",
    "DB_PASSWORD",
    "DB_HOST",
    "DB_PORT",
];

// Validate required environment variables at startup
function validateEnv(phase: string) {
    let configurationError = false;
    if (phase !== PHASE_PRODUCTION_BUILD) {
        for (const variable of requiredEnvVars) {
            // Log an error if a required configuration setting isn't defined.
            if (!process.env[variable]) {
                logger.error(`configuration error: ${variable} is not defined`);
                configurationError = true;
            }
        }
    }

    return configurationError;
}

// init initializes the application and exits if an initialization error is encountered.
function init(phase: string): NextConfig {
    const configurationError = validateEnv(phase);
    if (configurationError) {
        process.exit(1);
    }

    return {
        // Full URL logging to the console when running in dev mode.
        logging: { fetches: { fullUrl: true } },
    };
}

export default init;

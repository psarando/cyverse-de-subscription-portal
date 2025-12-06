import type {
    GetServerSidePropsContext,
    NextApiRequest,
    NextApiResponse,
} from "next";
import getConfig from "next/config";

import type { NextAuthOptions } from "next-auth";
import { getServerSession, DefaultUser } from "next-auth";
import KeycloakProvider from "next-auth/providers/keycloak";

declare module "next-auth" {
    // Extend the Session type to include accessToken, accessTokenExp, and username.
    interface Session {
        accessToken?: string | null;
        accessTokenExp?: number | null;
        user?: {
            username?: string | null;
            admin?: boolean | null;
        } & DefaultUser;
    }

    // Extend the Profile type to include username and exp.
    interface Profile {
        exp?: number | null;
        preferred_username?: string | null;
        entitlement?: Array<string> | null;
    }
}

declare module "next-auth/jwt" {
    // Extend the JWT type to include accessToken, username, and accessTokenExp.
    interface JWT {
        accessToken?: string | null;
        accessTokenExp?: number | null;
        username?: string | null;
        admin?: boolean | null;
    }
}

const { serverRuntimeConfig } = getConfig();
const adminGroups: string[] = serverRuntimeConfig?.adminGroups
    ?.split(",")
    ?.map((group: string) => group.trim());

// The `NextAuth` config, for use in `app/api/auth/[...nextauth]/route.ts`
export const config = {
    debug: process.env.NODE_ENV !== "production",
    theme: {
        logo: "/cyverse_logo_2.png",
    },
    providers: [
        KeycloakProvider({
            clientId: serverRuntimeConfig.keycloakClientId || "",
            clientSecret: serverRuntimeConfig.keycloakClientSecret || "",
            issuer: serverRuntimeConfig.keycloakIssuer,
        }),
    ],
    callbacks: {
        async jwt({ token, account, profile }) {
            // Persist the OAuth access_token and the username in the token right after signin.
            if (profile) {
                token.accessToken = account?.access_token;
                token.accessTokenExp = profile.exp;
                token.username = profile.preferred_username;
                token.admin = !!profile.entitlement?.find((role) =>
                    adminGroups.includes(role),
                );
            }

            return token;
        },
        async session({ session, token }) {
            // Send properties to the client, like the accessToken and username from the provider.
            session.accessToken = token.accessToken;
            session.accessTokenExp = token.accessTokenExp;
            if (session.user) {
                session.user.username = token.username;
                session.user.admin = token.admin;
            }

            return session;
        },
    },
} satisfies NextAuthOptions;

// Use it in server contexts
export function auth(
    ...args:
        | [GetServerSidePropsContext["req"], GetServerSidePropsContext["res"]]
        | [NextApiRequest, NextApiResponse]
        | []
) {
    return getServerSession(...args, config);
}

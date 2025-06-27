import type {
    GetServerSidePropsContext,
    NextApiRequest,
    NextApiResponse,
} from "next";
import type { NextAuthOptions } from "next-auth";
import { getServerSession } from "next-auth";
import KeycloakProvider from "next-auth/providers/keycloak";

// The `NextAuth` config, for use in `app/api/auth/[...nextauth]/route.ts`
export const config = {
    debug: process.env.NODE_ENV !== "production",
    theme: {
        logo: "/cyverse_logo_0.png",
    },
    providers: [
        KeycloakProvider({
            clientId: process.env.SP_KEYCLOAK_CLIENT_ID || "",
            clientSecret: process.env.SP_KEYCLOAK_CLIENT_SECRET || "",
            issuer: process.env.SP_KEYCLOAK_ISSUER,
        }),
    ],
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

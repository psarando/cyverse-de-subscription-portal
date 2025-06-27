"use client";

import { useSession, SessionProvider, signIn, signOut } from "next-auth/react";

const LoginBtn = () => {
    const { data: session } = useSession();

    return session ? (
        <div>
            Signed in as {session.user?.email} <br />
            <button
                className="rounded-full border border-solid border-black/[.08] dark:border-white/[.145] transition-colors flex items-center justify-center hover:bg-[#f2f2f2] dark:hover:bg-[#1a1a1a] hover:border-transparent font-medium text-sm sm:text-base h-10 sm:h-12 px-4 sm:px-5 w-full sm:w-auto md:w-[158px]"
                onClick={() => signOut()}
            >
                Sign out
            </button>
        </div>
    ) : (
        <div>
            Not signed in <br />
            <button
                className="rounded-full border border-solid border-black/[.08] dark:border-white/[.145] transition-colors flex items-center justify-center hover:bg-[#f2f2f2] dark:hover:bg-[#1a1a1a] hover:border-transparent font-medium text-sm sm:text-base h-10 sm:h-12 px-4 sm:px-5 w-full sm:w-auto md:w-[158px]"
                onClick={() => signIn("keycloak")}
            >
                Sign in
            </button>
        </div>
    );
};

export default function Component() {
    return (
        <SessionProvider>
            <LoginBtn />
        </SessionProvider>
    );
}

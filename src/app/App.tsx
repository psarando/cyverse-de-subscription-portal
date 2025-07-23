"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { SessionProvider } from "next-auth/react";

export default function App({ children }: { children: React.ReactNode }) {
    const queryClient = new QueryClient({
        defaultOptions: {
            queries: { refetchOnWindowFocus: false, retry: false },
        },
    });

    return (
        <SessionProvider
            // Disable session re-fetches when window is focused
            refetchOnWindowFocus={false}
        >
            <QueryClientProvider client={queryClient}>
                {children}
            </QueryClientProvider>
        </SessionProvider>
    );
}

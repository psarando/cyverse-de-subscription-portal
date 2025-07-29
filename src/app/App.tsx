"use client";

import { CartInfoProvider } from "@/contexts/cart";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { SessionProvider } from "next-auth/react";

const queryClient = new QueryClient({
    defaultOptions: {
        queries: { refetchOnWindowFocus: false, retry: false },
    },
});

export default function App({ children }: { children: React.ReactNode }) {
    return (
        <SessionProvider
            // Disable session re-fetches when window is focused
            refetchOnWindowFocus={false}
        >
            <QueryClientProvider client={queryClient}>
                <CartInfoProvider>{children}</CartInfoProvider>
            </QueryClientProvider>
        </SessionProvider>
    );
}

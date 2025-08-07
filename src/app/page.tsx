import { auth } from "@/auth";
import SubscriptionSummary from "@/components/SubscriptionSummary";

import { Typography } from "@mui/material";

export default async function Home() {
    const session = await auth();

    return (
        <>
            <Typography variant="h4">Welcome {session?.user?.name}!</Typography>
            <SubscriptionSummary />
        </>
    );
}

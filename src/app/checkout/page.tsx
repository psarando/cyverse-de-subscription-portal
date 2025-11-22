import getConfig from "next/config";

import Checkout from "@/components/forms/Checkout";

const { publicRuntimeConfig } = getConfig();

export default async function CheckoutPage() {
    const { authorizeNetHostedEndpoint } = publicRuntimeConfig;
    return <Checkout authorizeNetHostedEndpoint={authorizeNetHostedEndpoint} />;
}

import Checkout from "@/components/forms/Checkout";

export default async function CheckoutPage() {
    const authorizeNetHostedEndpoint =
        process.env.SP_AUTHORIZE_NET_HOSTED_ENDPOINT || "";

    return <Checkout authorizeNetHostedEndpoint={authorizeNetHostedEndpoint} />;
}

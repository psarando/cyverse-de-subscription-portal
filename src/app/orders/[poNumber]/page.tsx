import OrderDetails from "@/components/OrderDetails";

export default async function OrderDetailsPage({
    params,
}: {
    params: Promise<{ poNumber: string }>;
}) {
    const { poNumber } = await params;
    return <OrderDetails poNumber={parseInt(poNumber)} />;
}

"use client";

import { useCartInfo } from "@/contexts/cart";

export default function Checkout() {
    const [cartInfo] = useCartInfo();

    return <pre>{JSON.stringify(cartInfo, null, 2)}</pre>;
}

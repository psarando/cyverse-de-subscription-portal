import { OrderDir, OrderRequest, PurchaseSortField } from "./types";

export class HttpError extends Error {
    status: number;
    method: string;
    url: string;
    response: string;

    constructor(
        method: string,
        url: string,
        status: number,
        message: string,
        response: string,
    ) {
        super(message);
        this.method = method;
        this.url = url;
        this.status = status;
        this.response = response;
    }
}

async function callApiRoute(method: string, url: string, body?: string) {
    const response = await fetch(url, {
        method,
        headers: {
            "Content-Type": "application/json",
        },
        body,
    });

    if (!response.ok) {
        const responseText = await response.text();
        throw new HttpError(
            method,
            url,
            response.status,
            response.statusText,
            responseText,
        );
    }

    return await response.json();
}

function get(url: string) {
    return callApiRoute("GET", url);
}

function post(url: string, body: object) {
    return callApiRoute("POST", url, JSON.stringify(body));
}

/**
 * Fetch the user's resource usage summary.
 */
export function getResourceUsageSummary() {
    return get("/api/resource-usage/summary");
}

export const RESOURCE_USAGE_QUERY_KEY = "fetchResourceUsage";

/**
 * Fetch subscription plan names.
 */
export function getPlanTypes() {
    return get("/api/subscriptions/plans");
}

export const PLAN_TYPES_QUERY_KEY = "fetchPlanTypes";

/**
 * Fetch subscription add-ons.
 */
export function getAddons() {
    return get("/api/subscriptions/addons");
}

export const ADDONS_QUERY_KEY = "fetchAddons";

/**
 * Place a purchase order.
 */
export function postOrder(order: OrderRequest) {
    return post("/api/order", order);
}

/**
 * Fetch the user's orders.
 */
export function getOrders(params?: {
    orderBy: PurchaseSortField;
    orderDir: OrderDir;
}) {
    let url = "/api/orders";

    const { orderBy, orderDir } = params ?? {};
    if (orderBy || orderDir) {
        const queryParams = new URLSearchParams();

        if (orderBy) {
            queryParams.append("orderBy", orderBy);
        }
        if (orderDir) {
            queryParams.append("orderDir", orderDir);
        }

        url = `${url}?${queryParams}`;
    }

    return get(url);
}

export const ORDERS_QUERY_KEY = "fetchOrders";

/**
 * Fetch order details.
 */
export function getOrderDetails(poNumber: number) {
    return get(`/api/orders/${poNumber}`);
}

export const ORDER_DETAILS_QUERY_KEY = "fetchOrderDetails";

import { UUID } from "crypto";

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
 * Place a purchase order.
 */
export function postOrder(transaction: TransactionRequest) {
    return post("/api/order", transaction);
}

export type SubscriptionSummaryDetails = {
    users: {
        username: string;
    };
    plan: {
        name: string;
    };
    effective_start_date: number;
    effective_end_date: number;
    quotas: Array<{
        id: UUID;
        quota: number;
        resource_type: {
            description: string;
            unit: string;
        };
    }>;
    usages: Array<{
        id: UUID;
        usage: number;
        resource_type: {
            name: string;
            description: string;
        };
    }>;
    addons: Array<{
        id: UUID;
        amount: number;
        paid: boolean;
        addon: {
            name: string;
            resource_type: {
                name: string;
                description: string;
            };
        };
    }>;
};

export type PlanType = {
    name: string;
    description: string;
    plan_rates: Array<{ rate: number }>;
    plan_quota_defaults: Array<{
        id: UUID;
        quota_value: number;
        resource_type: {
            name: string;
            unit: string;
        };
    }>;
};

export type SubscriptionSubmission = {
    username: string;
    plan_name: string;
    plan_rate?: number;
    paid: boolean;
    periods: number;
    start_date?: string;
    end_date?: string;
};

export type TransactionRequest = {
    transactionType?: string;
    amount: number;
    currencyCode: string;
    payment: {
        creditCard: {
            cardNumber: string;
            expirationDate: string;
            cardCode: string;
        };
    };
    lineItems?: Array<{
        lineItem: {
            itemId: string;
            name: string;
            description?: string;
            quantity: number;
            unitPrice: number;
        };
    }>;
    billTo: {
        firstName: string;
        lastName: string;
        company?: string;
        address: string;
        city: string;
        state: string;
        zip: string;
        country: string;
    };
};

export type OrderError = {
    transactionResponse?: {
        errors?: Array<{ errorCode: string; errorText: string }>;
    };
    messages?: Array<{ code: string; text: string }>;
};

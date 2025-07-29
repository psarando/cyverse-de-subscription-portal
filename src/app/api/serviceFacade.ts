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

async function get(url: string) {
    const method = "GET";
    const response = await fetch(url, {
        method,
        headers: {
            "Content-Type": "application/json",
        },
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

/**
 * Fetch the user's resource usage summary.
 */
export async function getResourceUsageSummary() {
    return await get("/api/resource-usage/summary");
}

export const RESOURCE_USAGE_QUERY_KEY = "fetchResourceUsage";

/**
 * Fetch subscription plan names.
 */
export async function getPlanTypes() {
    return await get("/api/subscriptions/plans");
}

export const PLAN_TYPES_QUERY_KEY = "fetchPlanTypes";

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
    paid: boolean;
    periods: number;
    start_date?: string;
    end_date?: string;
};

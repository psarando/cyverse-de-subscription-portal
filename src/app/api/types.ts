import { UUID } from "crypto";

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
    poNumber?: number;
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
    customerIP?: string;
};

export type TerrainError = {
    error_code?: string;
    message?: string;
    reason?: string;
    grouper_result_message?: string;
};

export type OrderError = TerrainError & {
    transactionResponse?: {
        errors?: Array<{ errorCode: string; errorText: string }>;
    };
    messages?: Array<{ code: string; text: string }>;
    currentPricing?: {
        amount: number;
        subscription?: { name: string; rate: number };
    };
};

import { UUID } from "crypto";

export enum OrderDir {
    ASC = "asc",
    DESC = "desc",
}

export type SubscriptionSummaryDetails = {
    id: UUID;
    users: {
        username: string;
    };
    plan: {
        name: string;
    };
    effective_start_date: string;
    effective_end_date: string;
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

export type ResourceUsageSummary = {
    subscription: SubscriptionSummaryDetails;
};

type ResourceType = {
    name: string;
    unit: string;
    consumable: boolean;
};

export type PlanType = {
    id: UUID;
    name: string;
    description: string;
    plan_rates: Array<{ rate: number }>;
    plan_quota_defaults: Array<{
        id: UUID;
        quota_value: number;
        resource_type: ResourceType;
    }>;
};

export type AddonsType = {
    uuid: UUID;
    name: string;
    description: string;
    resource_type: ResourceType;
    addon_rates: Array<{
        rate: number;
    }>;
};

export type AddonsList = {
    addons: Array<AddonsType>;
};

export type OrderSummary = {
    id: UUID;
    po_number: number;
    amount: number;
    order_date: string;
};

export type OrdersList = {
    orders: Array<OrderSummary>;
};

export enum PurchaseSortField {
    AMOUNT = "amount",
    ORDER_DATE = "order_date",
    PO_NUMBER = "po_number",
}

export type SubscriptionSubmission = {
    username: string;
    plan_name: string;
    plan_rate?: number;
    paid?: boolean;
    periods: number;
    start_date?: string;
    end_date?: string;
};

export enum LineItemIDEnum {
    SUBSCRIPTION = "subscription",
    ADDON = "addon",
}

export type TransactionRequest = {
    transactionType: string;
    amount: number;
    currencyCode: string;
    payment: {
        creditCard: {
            cardNumber: string;
            expirationDate: string;
            cardCode: string;
        };
    };
    lineItems?: {
        lineItem?: Array<{
            /**
             * The ID of the subscription or add-on from QMS,
             * not submitted to Authorize.net.
             */
            id?: UUID;
            /**
             * The item type ("subscription" or "addon").
             */
            itemId: LineItemIDEnum;
            /**
             * The plan name or add-on name.
             */
            name: string;
            description?: string;
            quantity: number;
            unitPrice: number;
        }>;
    };
    poNumber?: number;
    customer?: {
        email: string;
    };
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
    transactionSettings: {
        setting: Array<{
            settingName: string;
            settingValue: string | boolean;
        }>;
    };
};

type CreateTransactionResponseMessage = { code: string; text: string };

export type CreateTransactionResponse = {
    transactionResponse: {
        responseCode: string;
        authCode: string;
        avsResultCode?: string | null;
        cvvResultCode?: string | null;
        cavvResultCode?: string | null;
        transId?: string | null;
        refTransID?: string | null;
        testRequest?: string | null;
        accountNumber?: string | null;
        accountType?: string | null;
        transHashSha2?: string | null;
        SupplementalDataQualificationIndicator?: number | null;
        networkTransId?: string | null;
        errors?: Array<{ errorCode: string; errorText: string }>;
    };
    messages?: {
        resultCode: string;
        message: Array<CreateTransactionResponseMessage>;
    };
};

export type OrderRequest = Pick<
    TransactionRequest,
    "amount" | "billTo" | "currencyCode" | "lineItems" | "payment"
> & {
    termsAcknowledged: boolean;
};

export type OrderUpdateError = {
    method?: string;
    url?: string;
    status?: number;
    message: string;
    response?: object;
};

export type OrderUpdateResult = {
    success: boolean;
    message?: string | object;
    poNumber?: number;
    /**
     * Date when read from the db, or string from the /api/order endpoint.
     */
    orderDate?: Date | string;
    transactionResponse?: Pick<
        CreateTransactionResponse["transactionResponse"],
        "transId" | "accountNumber" | "accountType" | "errors"
    >;
    error?: OrderUpdateError;
    subscription?: {
        status: string;
        result: Pick<
            SubscriptionSummaryDetails,
            "effective_start_date" | "effective_end_date" | "plan"
        > & {
            quotas: Array<{
                id: UUID;
                quota: number;
                resource_type: ResourceType;
            }>;
        };
    };
    addons?: Array<{
        error?: OrderUpdateError;
        subscription_addon?: {
            uuid: UUID;
            amount: number;
            paid: boolean;
            addon: {
                name: string;
                description: string;
                resource_type: ResourceType;
            };
        };
    }>;
};

export type TerrainError = {
    error_code?: string;
    message?: string;
    reason?: string;
    grouper_result_message?: string;
};

export type OrderError = TerrainError & {
    transactionResponse?: Pick<
        CreateTransactionResponse["transactionResponse"],
        "errors"
    >;
    messages?: Array<CreateTransactionResponseMessage>;
    currentPricing?: {
        amount: number;
        subscription?: { name: string; rate: number };
    };
};

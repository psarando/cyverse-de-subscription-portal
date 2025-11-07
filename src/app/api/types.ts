import { UUID } from "crypto";

export enum OrderDir {
    ASC = "asc",
    DESC = "desc",
}

type ResourceType = {
    name: string;
    unit: string;
    consumable: boolean;
};

export type Subscription = {
    id: UUID;
    user: {
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
        resource_type: ResourceType;
    }>;
    usages: Array<{
        id: UUID;
        usage: number;
        resource_type: ResourceType;
    }>;
};

export type UserSubscriptionListing = {
    result: {
        total: number;
        subscriptions: Array<Subscription>;
    };
    error: string;
    status: string;
};

export type SubscriptionSummaryDetails = Omit<
    Subscription,
    "user" | "quotas" | "usages"
> & {
    users: {
        username: string;
    };
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
    err_count: number;
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

type LineItem = {
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
};

export type TransactionRequest = {
    transactionType: string;
    amount: number;
    currencyCode: string;
    payment?: {
        creditCard: {
            cardNumber: string;
            expirationDate: string;
            cardCode: string;
        };
    };
    order?: { description?: string };
    lineItems?: {
        lineItem?: Array<LineItem>;
    };
    poNumber?: number;
    customer?: {
        email: string;
    };
    billTo?: {
        firstName: string;
        lastName: string;
        company?: string | null;
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

type AuthzNetResponseMessage = { code: string; text: string };
type AuthzNetResponseMessages = {
    resultCode: string;
    message: Array<AuthzNetResponseMessage>;
};

export type HostedPaymentSettings = TransactionRequest["transactionSettings"];
export type GetHostedPaymentPageResponse = {
    token?: string;
    messages: AuthzNetResponseMessages;
};

export enum TransactionResponseCodeEnum {
    APPROVED = 1,
    DECLINED = 2,
    ERROR = 3,
    HELD_FOR_REVIEW = 4,
}

export type CreateTransactionResponse = {
    transactionResponse: {
        responseCode: TransactionResponseCodeEnum;
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
    messages?: AuthzNetResponseMessages;
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

type OrderDetailTransactionResponse = Pick<
    CreateTransactionResponse["transactionResponse"],
    "transId" | "accountNumber" | "accountType" | "errors"
>;

export type OrderDetails = Pick<TransactionRequest, "billTo"> & {
    id: UUID;
    username: string;
    poNumber: number;
    /**
     * Amount is returned as a formatted currency string from the db.
     */
    amount: string;
    /**
     * Date when read from the db, or string from order endpoints.
     */
    orderDate: Date | string;
    payment?: {
        creditCard: Pick<
            Required<TransactionRequest>["payment"]["creditCard"],
            "cardNumber" | "expirationDate"
        >;
    };
    /**
     * unitPrice is returned as a formatted currency string from the db.
     */
    lineItems?: Array<
        Omit<LineItem, "unitPrice"> & { unitPrice: string; qmsId: UUID }
    >;
    transactionResponse: OrderDetailTransactionResponse & {
        messages?: Array<AuthzNetResponseMessage>;
    };
};

export type OrderUpdateResult = {
    message?: string | object;
    poNumber?: number;
    orderDate?: OrderDetails["orderDate"];
    token?: string;
    transactionResponse?: OrderDetailTransactionResponse;
    error?: OrderUpdateError;
};

export type SubscriptionUpdateResult = {
    success: boolean;
    status?: string;
    error?: string | OrderUpdateError;
    result?: Pick<
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

export type AddonsUpdateResult = {
    success: boolean;
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
    messages?: Array<AuthzNetResponseMessage>;
    currentPricing?: {
        amount: number;
        subscription?: { name: string; rate: number };
    };
};

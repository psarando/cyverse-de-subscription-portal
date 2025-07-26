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

/**
 * Fetch subscription plan names.
 */
export async function getPlanTypes() {
    return await get("/api/subscriptions/plans");
}

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

export async function getResourceUsageSummary() {
    const method = "GET";
    const url = "/api/resource-usage/summary";

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

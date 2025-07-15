export class HttpError extends Error {
    status: number;
    constructor(status: number, message: string) {
        super(message);
        this.status = status;
    }
}

export async function getResourceUsageSummary() {
    const response = await fetch("/api/resource-usage/summary", {
        method: "GET",
        headers: {
            "Content-Type": "application/json",
        },
    });

    if (!response.ok) {
        const errorMessage = await response.text();
        throw new HttpError(
            response.status,
            errorMessage || `HTTP error status: ${response.status}`,
        );
    }

    return await response.json();
}

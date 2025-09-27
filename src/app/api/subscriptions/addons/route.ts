import { serviceAccountFetchAddons } from "@/app/api/terrain";

export async function GET() {
    return serviceAccountFetchAddons();
}

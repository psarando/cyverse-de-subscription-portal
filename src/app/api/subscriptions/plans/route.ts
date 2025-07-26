import { callTerrain } from "@/app/api/terrain";

export function GET() {
    return callTerrain("GET", "/qms/plans");
}

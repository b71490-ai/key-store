import { handleAdminLogin } from "../authShared";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request) {
	return handleAdminLogin(request);
}

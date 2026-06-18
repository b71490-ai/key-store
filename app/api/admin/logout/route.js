import { handleAdminLogout } from "../authShared";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST() {
	return handleAdminLogout();
}

export async function DELETE() {
	return handleAdminLogout();
}

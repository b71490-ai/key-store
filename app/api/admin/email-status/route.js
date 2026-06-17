import { NextResponse } from "next/server";
import { getEmailQueueStats, processEmailQueue, retryAllEmails } from "../../orders/emailQueue";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
	const stats = await getEmailQueueStats();

	return NextResponse.json({
		success: true,
		data: stats,
	});
}

export async function POST(request) {
	const body = await request.json().catch(() => ({}));
	const action = body?.action || "process";
	const result = action === "retry-all"
		? await retryAllEmails()
		: await processEmailQueue({ force: Boolean(body?.force) });

	return NextResponse.json({
		success: true,
		action,
		data: result,
	});
}

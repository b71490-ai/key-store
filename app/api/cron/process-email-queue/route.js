import { NextResponse } from "next/server";
import { processEmailQueue } from "../../orders/emailQueue";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function isAuthorized(request) {
	const cronSecret = process.env.CRON_SECRET;
	if (!cronSecret) return true;

	const authorization = request.headers.get("authorization") || "";
	return authorization === `Bearer ${cronSecret}`;
}

export async function GET(request) {
	if (!isAuthorized(request)) {
		return NextResponse.json(
			{ success: false, message: "Unauthorized cron request." },
			{ status: 401 }
		);
	}

	const result = await processEmailQueue();

	return NextResponse.json({
		success: true,
		data: result,
	});
}

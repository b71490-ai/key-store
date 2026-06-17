import { NextResponse } from "next/server";
import { getEmailDiagnostics } from "../../orders/emailDiagnostics";
import { getEmailQueueStats } from "../../orders/emailQueue";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function maskEndpoint(endpoint = "") {
	if (!endpoint) return null;

	try {
		const url = new URL(endpoint);
		return `${url.origin}${url.pathname.slice(0, 8)}...`;
	} catch {
		return "configured";
	}
}

export async function GET() {
	const formcarryEndpoint = process.env.FORMCARRY_ENDPOINT;
	const orderReceiverEmail = process.env.ORDER_RECEIVER_EMAIL;
	const [diagnostics, queueStats] = await Promise.all([
		getEmailDiagnostics(),
		getEmailQueueStats(),
	]);

	return NextResponse.json({
		success: true,
		formcarry: {
			configured: Boolean(formcarryEndpoint),
			status: formcarryEndpoint ? "configured" : "missing",
			endpoint: maskEndpoint(formcarryEndpoint),
			lastResponse: diagnostics.lastFormcarryStatus,
		},
		orderReceiverEmail: {
			configured: Boolean(orderReceiverEmail),
			status: orderReceiverEmail ? "configured" : "missing",
			value: orderReceiverEmail || null,
		},
		lastError: diagnostics.lastError,
		lastOrder: diagnostics.lastOrder,
		queue: {
			sentCount: queueStats.sentCount,
			pendingCount: queueStats.pendingCount,
			failedCount: queueStats.failedCount,
			totalQueued: queueStats.totalQueued,
		},
		lastUpdatedAt: diagnostics.lastUpdatedAt,
	});
}

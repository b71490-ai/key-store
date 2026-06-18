import { NextResponse } from "next/server";
import { retryOrderEmail } from "../../../orders/emailQueue";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request) {
	const body = await request.json().catch(() => ({}));
	const orderId = String(body?.orderId || body?.queueId || "").trim();

	if (!orderId) {
		return NextResponse.json(
			{ success: false, message: "يرجى إرسال orderId أو queueId." },
			{ status: 400 }
		);
	}

	try {
		const result = await retryOrderEmail(orderId);
		return NextResponse.json({
			success: true,
			message: "تم تشغيل إعادة إرسال الطلب.",
			data: result,
		});
	} catch (error) {
		return NextResponse.json(
			{
				success: false,
				message: error instanceof Error ? error.message : "تعذر إعادة إرسال الطلب.",
			},
			{ status: 404 }
		);
	}
}

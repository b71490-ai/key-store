import { NextResponse } from "next/server";

const ordersStore = [];

export async function GET() {
	return NextResponse.json({
		success: true,
		count: ordersStore.length,
		data: ordersStore,
	});
}

export async function POST(request) {
	const body = await request.json();

	if (!body?.order?.productName || !body?.customer?.name || !body?.payment?.method) {
		return NextResponse.json(
			{ success: false, message: "بيانات الطلب غير مكتملة." },
			{ status: 400 }
		);
	}

	const orderId = `ORD-${Date.now()}`;
	const createdAt = new Date().toISOString();

	const newOrder = {
		orderId,
		createdAt,
		order: body.order,
		customer: body.customer,
		payment: body.payment,
		status: "received",
	};

	ordersStore.unshift(newOrder);

	return NextResponse.json(
		{
			success: true,
			message: "تم استلام الطلب بنجاح.",
			data: newOrder,
		},
		{ status: 201 }
	);
}

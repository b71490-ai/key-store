import { NextResponse } from "next/server";

const ordersStore = [];

function normalizeCardNumber(value = "") {
	return String(value).replace(/\D/g, "");
}

function detectCardScheme(normalized) {
	if (/^4\d{12}(\d{3})?(\d{3})?$/.test(normalized)) return "visa";
	if (/^(5[1-5]\d{14}|2(2[2-9]\d{12}|[3-6]\d{13}|7[01]\d{12}|720\d{12}))$/.test(normalized)) return "mastercard";
	if (/^3[47]\d{13}$/.test(normalized)) return "amex";
	if (/^6(?:011\d{12}|5\d{14}|4[4-9]\d{13})$/.test(normalized)) return "discover";
	return null;
}

function isValidCardNumber(cardNumber) {
	const normalized = normalizeCardNumber(cardNumber);
	if (normalized.length < 13 || normalized.length > 19) return false;
	if (/^(\d)\1+$/.test(normalized)) return false;
	if (!detectCardScheme(normalized)) return false;

	let sum = 0;
	let shouldDouble = false;
	for (let index = normalized.length - 1; index >= 0; index -= 1) {
		let digit = Number(normalized[index]);
		if (shouldDouble) {
			digit *= 2;
			if (digit > 9) digit -= 9;
		}
		sum += digit;
		shouldDouble = !shouldDouble;
	}

	return sum % 10 === 0;
}

function isValidExpiry(expiry = "") {
	const match = String(expiry).match(/^(\d{2})\/(\d{2})$/);
	if (!match) return false;

	const month = Number(match[1]);
	const year = Number(`20${match[2]}`);
	if (month < 1 || month > 12) return false;

	const now = new Date();
	const currentYear = now.getFullYear();
	const currentMonth = now.getMonth() + 1;

	if (year < currentYear) return false;
	if (year === currentYear && month < currentMonth) return false;
	return true;
}

function isValidCvc(cvc = "", cardNumber = "") {
	const cleanedCvc = String(cvc).trim();
	const normalizedCard = normalizeCardNumber(cardNumber);
	const scheme = detectCardScheme(normalizedCard);

	if (!/^\d{3,4}$/.test(cleanedCvc)) return false;
	if (scheme === "amex") return /^\d{4}$/.test(cleanedCvc);
	if (scheme === "visa" || scheme === "mastercard" || scheme === "discover") {
		return /^\d{3}$/.test(cleanedCvc);
	}

	return false;
}

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

	let sanitizedPayment = body.payment;
	if (body.payment.method === "card") {
		const cardHolder = String(body?.payment?.cardHolder || "").trim();
		const cardNumberRaw = normalizeCardNumber(body?.payment?.cardNumberRaw || "");
		const cardExpiry = String(body?.payment?.card_expiry || "");
		const cardCvc = String(body?.payment?.cardCvc || "");

		if (cardHolder.length < 3) {
			return NextResponse.json(
				{ success: false, message: "اسم حامل البطاقة غير صالح." },
				{ status: 400 }
			);
		}

		if (!isValidCardNumber(cardNumberRaw)) {
			return NextResponse.json(
				{ success: false, message: "رقم البطاقة غير صالح." },
				{ status: 400 }
			);
		}

		if (!isValidExpiry(cardExpiry)) {
			return NextResponse.json(
				{ success: false, message: "تاريخ انتهاء البطاقة غير صالح." },
				{ status: 400 }
			);
		}

		if (!isValidCvc(cardCvc, cardNumberRaw)) {
			return NextResponse.json(
				{ success: false, message: "رمز CVC غير صالح." },
				{ status: 400 }
			);
		}

		const cardBrand = detectCardScheme(cardNumberRaw);
		sanitizedPayment = {
			method: "card",
			cardHolder,
			card_expiry: cardExpiry,
			cardBrand,
			cardNumberMasked: `**** **** **** ${cardNumberRaw.slice(-4)}`,
		};
	}

	const orderId = `ORD-${Date.now()}`;
	const createdAt = new Date().toISOString();

	const newOrder = {
		orderId,
		createdAt,
		order: body.order,
		customer: body.customer,
		payment: sanitizedPayment,
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

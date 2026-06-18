import { NextResponse } from "next/server";

const SESSION_COOKIE = "key_store_admin_session";

function base64UrlToBytes(value) {
	const normalized = value.replace(/-/g, "+").replace(/_/g, "/");
	const padded = normalized.padEnd(normalized.length + ((4 - (normalized.length % 4)) % 4), "=");
	const binary = atob(padded);
	return Uint8Array.from(binary, (char) => char.charCodeAt(0));
}

async function verifySessionToken(token) {
	const secret = process.env.ADMIN_SECRET;
	if (!secret || !token) return false;

	const [payload, signature] = token.split(".");
	if (!payload || !signature) return false;

	const key = await crypto.subtle.importKey(
		"raw",
		new TextEncoder().encode(secret),
		{ name: "HMAC", hash: "SHA-256" },
		false,
		["verify"]
	);

	const isValid = await crypto.subtle.verify(
		"HMAC",
		key,
		base64UrlToBytes(signature),
		new TextEncoder().encode(payload)
	);

	if (!isValid) return false;

	try {
		const session = JSON.parse(new TextDecoder().decode(base64UrlToBytes(payload)));
		return session?.role === "admin" && Number(session?.exp || 0) > Math.floor(Date.now() / 1000);
	} catch {
		return false;
	}
}

export async function middleware(request) {
	const { pathname } = request.nextUrl;
	const isAdminPage = pathname === "/admin" || pathname.startsWith("/admin/");
	const isAdminApi = pathname.startsWith("/api/admin/");
	const isLegacyAdminAuthApi = pathname === "/api/admin-auth";
	const isLoginPage = pathname === "/admin/login";
	const isLoginApi = pathname === "/api/admin/login";

	if (isLoginApi) {
		return NextResponse.next();
	}

	if (isLoginPage) {
		const token = request.cookies.get(SESSION_COOKIE)?.value;
		if (await verifySessionToken(token)) {
			return NextResponse.redirect(new URL("/admin", request.url));
		}
		return NextResponse.next();
	}

	if (!isAdminPage && !isAdminApi && !isLegacyAdminAuthApi) {
		return NextResponse.next();
	}

	const token = request.cookies.get(SESSION_COOKIE)?.value;
	if (await verifySessionToken(token)) {
		return NextResponse.next();
	}

	if (isAdminApi || isLegacyAdminAuthApi) {
		return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
	}

	const loginUrl = new URL("/admin/login", request.url);
	loginUrl.searchParams.set("next", pathname);
	return NextResponse.redirect(loginUrl);
}

export const config = {
	matcher: ["/admin/:path*", "/api/admin/:path*", "/api/admin-auth"],
};

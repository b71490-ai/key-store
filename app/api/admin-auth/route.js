import { NextResponse } from "next/server";
import { handleAdminLogin, handleAdminLogout } from "../admin/authShared";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request) {
	return handleAdminLogin(request);
}

export async function DELETE() {
	return handleAdminLogout();
}

export async function PUT() {
	return NextResponse.json(
		{ message: "تغيير كلمة مرور الأدمن يتم الآن من متغيرات البيئة ADMIN_PASSWORD في Vercel." },
		{ status: 403 }
	);
}

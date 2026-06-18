"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import axios from "axios";
import { FiLock, FiUser } from "react-icons/fi";
import StoreNav from "../../components/StoreNav";

function AdminLoginContent() {
	const router = useRouter();
	const searchParams = useSearchParams();
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [error, setError] = useState("");
	const [isSubmitting, setIsSubmitting] = useState(false);

	const handleSubmit = async (event) => {
		event.preventDefault();
		setError("");

		try {
			setIsSubmitting(true);
			await axios.post("/api/admin/login", {
				email: email.trim(),
				password,
			});
			router.replace(searchParams.get("next") || "/admin");
			router.refresh();
		} catch (requestError) {
			setError(requestError?.response?.data?.message || "تعذر تسجيل الدخول الآن.");
		} finally {
			setIsSubmitting(false);
		}
	};

	return (
		<main className="admin-shell min-h-screen px-4 pb-10 pt-24 text-slate-800" dir="rtl">
			<StoreNav />
			<div className="soft-panel mx-auto w-full max-w-xl p-7 md:p-8">
				<div className="text-center">
					<div className="mx-auto inline-flex rounded-full bg-blue-50 p-3">
						<FiLock className="text-2xl text-[#1475d1]" />
					</div>
					<h1 className="mt-4 text-3xl font-extrabold tracking-tight dark-aware-text">تسجيل دخول الأدمن</h1>
					<p className="mt-2 text-sm text-slate-500 dark-aware-muted">
						أدخل بيانات الأدمن المخزنة في متغيرات البيئة.
					</p>
				</div>

				<form onSubmit={handleSubmit} className="mt-8 grid gap-4">
					<label className="text-sm font-semibold text-slate-700">
						البريد الإلكتروني
						<div className="relative mt-2">
							<FiUser className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-slate-400" />
							<input
								type="email"
								value={email}
								onChange={(event) => setEmail(event.target.value)}
								className="w-full rounded-2xl border border-slate-200 bg-slate-50 py-3 pl-4 pr-11 outline-none transition focus:border-[#1475d1]"
								autoComplete="email"
							/>
						</div>
					</label>

					<label className="text-sm font-semibold text-slate-700">
						كلمة المرور
						<div className="relative mt-2">
							<FiLock className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-slate-400" />
							<input
								type="password"
								value={password}
								onChange={(event) => setPassword(event.target.value)}
								className="w-full rounded-2xl border border-slate-200 bg-slate-50 py-3 pl-4 pr-11 outline-none transition focus:border-[#1475d1]"
								autoComplete="current-password"
							/>
						</div>
					</label>

					{error ? (
						<div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
							{error}
						</div>
					) : null}

					<button
						type="submit"
						disabled={isSubmitting}
						className="mt-2 inline-flex items-center justify-center rounded-full bg-[#1475d1] px-6 py-3 font-bold text-white transition hover:bg-[#0f5ca8] disabled:cursor-not-allowed disabled:opacity-70"
					>
						{isSubmitting ? "جارٍ التحقق..." : "دخول لوحة التحكم"}
					</button>
				</form>
			</div>
		</main>
	);
}

export default function AdminLoginPage() {
	return (
		<Suspense fallback={<div className="p-8 text-center">جارٍ تحميل تسجيل الدخول...</div>}>
			<AdminLoginContent />
		</Suspense>
	);
}

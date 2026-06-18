"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import axios from "axios";
import Swal from "sweetalert2";
import {
	FiArrowRight,
	FiClock,
	FiRefreshCw,
	FiRotateCw,
	FiSearch,
	FiShoppingBag,
} from "react-icons/fi";
import StoreNav from "../../components/StoreNav";

function formatDate(value) {
	if (!value) return "-";
	return new Date(value).toLocaleString("ar-EG", {
		year: "numeric",
		month: "2-digit",
		day: "2-digit",
		hour: "2-digit",
		minute: "2-digit",
	});
}

function formatDuration(value) {
	const number = Number(value);
	if (!Number.isFinite(number)) return "-";
	if (number < 1000) return `${number}ms`;
	return `${(number / 1000).toFixed(2)}s`;
}

function getStatusClass(status = "") {
	const value = String(status).toLowerCase();
	if (value.includes("sent")) return "border-emerald-200 bg-emerald-50 text-emerald-700";
	if (value.includes("failed")) return "border-red-200 bg-red-50 text-red-700";
	if (value.includes("retry") || value.includes("pending") || value.includes("queued")) return "border-amber-200 bg-amber-50 text-amber-700";
	return "border-slate-200 bg-slate-50 text-slate-600";
}

export default function AdminOrdersPage() {
	const [orders, setOrders] = useState([]);
	const [loading, setLoading] = useState(true);
	const [search, setSearch] = useState("");
	const [isRetrying, setIsRetrying] = useState("");

	const fetchOrders = async () => {
		try {
			setLoading(true);
			const response = await axios.get("/api/admin/orders");
			setOrders(response.data?.data ?? []);
		} catch {
			setOrders([]);
		} finally {
			setLoading(false);
		}
	};

	useEffect(() => {
		fetchOrders();
	}, []);

	const filteredOrders = useMemo(() => {
		const term = search.trim().toLowerCase();
		if (!term) return orders;

		return orders.filter((item) => {
			return [
				item.orderId,
				item.queueId,
				item.customer?.name,
				item.customer?.email,
				item.order?.productName,
				item.source,
				item.emailDelivery?.status,
			]
				.map((value) => String(value || "").toLowerCase())
				.some((value) => value.includes(term));
		});
	}, [orders, search]);

	const retryOrder = async (item) => {
		const retryId = item.queueId || item.orderId;
		if (!retryId) return;

		try {
			setIsRetrying(retryId);
			await axios.post("/api/admin/orders/retry", {
				orderId: item.orderId,
				queueId: item.queueId,
			});
			await fetchOrders();
			await Swal.fire({
				title: "تم تشغيل إعادة الإرسال",
				text: "تم إرسال الطلب إلى نظام Formcarry أو إعادته للمعالجة.",
				icon: "success",
				confirmButtonText: "حسنًا",
				confirmButtonColor: "#1475d1",
			});
		} catch (error) {
			await Swal.fire({
				title: "تعذرت إعادة الإرسال",
				text: error?.response?.data?.message || "لم يتم العثور على بيانات قابلة لإعادة الإرسال.",
				icon: "error",
				confirmButtonText: "حسنًا",
				confirmButtonColor: "#dc2626",
			});
		} finally {
			setIsRetrying("");
		}
	};

	return (
		<main className="admin-shell min-h-screen px-4 pb-10 pt-24 text-slate-800" dir="rtl">
			<StoreNav />
			<div className="mx-auto flex w-full max-w-7xl flex-col gap-6">
				<section className="admin-hero-panel p-7 text-white md:p-8">
					<Link href="/admin" className="inline-flex items-center gap-2 rounded-full border border-white/25 px-4 py-2 text-sm font-bold text-white transition hover:bg-white/10">
						<FiArrowRight />
						العودة للوحة الإدارة
					</Link>
					<div className="mt-6 flex flex-wrap items-end justify-between gap-4">
						<div>
							<div className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-xs font-bold text-blue-50">
								<FiShoppingBag />
								الطلبات المحفوظة
							</div>
							<h1 className="mt-4 text-4xl font-black tracking-tight">مركز الطلبات</h1>
							<p className="mt-3 text-sm leading-8 text-blue-100">
								عرض الطلبات المحفوظة من orders-store و Queue و failed emails حتى عند تأخر أو فشل البريد.
							</p>
						</div>
						<button type="button" onClick={fetchOrders} disabled={loading} className="inline-flex items-center gap-2 rounded-full bg-white px-5 py-3 text-sm font-black text-[#0f3b78] transition hover:bg-blue-100 disabled:opacity-70">
							<FiRefreshCw />
							تحديث
						</button>
					</div>
				</section>

				<section className="soft-panel p-5 md:p-6">
					<div className="flex flex-wrap items-center justify-between gap-3">
						<div>
							<h2 className="text-2xl font-black tracking-tight dark-aware-text">كل الطلبات</h2>
							<p className="mt-1 text-sm text-slate-500 dark-aware-muted">الإجمالي: {filteredOrders.length} من {orders.length}</p>
						</div>
						<div className="relative w-full sm:w-80">
							<FiSearch className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-slate-400" />
							<input
								value={search}
								onChange={(event) => setSearch(event.target.value)}
								className="w-full rounded-2xl border border-slate-200 bg-slate-50 py-3 pl-4 pr-11 text-sm font-semibold outline-none transition focus:border-[#1475d1]"
								placeholder="بحث برقم الطلب أو العميل أو الحالة"
							/>
						</div>
					</div>

					{loading ? (
						<div className="mt-6 grid gap-3">
							{[0, 1, 2].map((item) => (
								<div key={item} className="skeleton-line h-16 w-full" />
							))}
						</div>
					) : null}

					{!loading ? (
						<div className="mt-6 overflow-x-auto rounded-2xl border border-slate-200">
							<table className="min-w-[1180px] w-full text-right text-sm">
								<thead className="bg-slate-50 text-xs font-black text-slate-500">
									<tr>
										<th className="px-4 py-3">الطلب</th>
										<th className="px-4 py-3">العميل</th>
										<th className="px-4 py-3">المنتج</th>
										<th className="px-4 py-3">الإجمالي</th>
										<th className="px-4 py-3">المصدر</th>
										<th className="px-4 py-3">الحالة</th>
										<th className="px-4 py-3">Formcarry</th>
										<th className="px-4 py-3">وقت الإرسال</th>
										<th className="px-4 py-3">وقت الوصول</th>
										<th className="px-4 py-3">التأخير</th>
										<th className="px-4 py-3">إجراء</th>
									</tr>
								</thead>
								<tbody className="divide-y divide-slate-100 bg-white">
									{filteredOrders.map((item) => {
										const retryId = item.queueId || item.orderId;
										const canRetry = item.queueId || String(item.source || "").includes("queue") || String(item.source || "").includes("failed");
										return (
											<tr key={item.id} className="align-top transition hover:bg-slate-50">
												<td className="px-4 py-4">
													<div className="font-black text-slate-900">{item.orderId}</div>
													<div className="mt-1 inline-flex items-center gap-1 text-xs text-slate-400"><FiClock /> {formatDate(item.createdAt || item.failedAt)}</div>
												</td>
												<td className="px-4 py-4">
													<div className="font-bold text-slate-800">{item.customer?.name || "-"}</div>
													<div className="text-xs text-slate-500">{item.customer?.email || "-"}</div>
												</td>
												<td className="px-4 py-4">
													<div className="font-bold text-slate-800">{item.order?.productName || "-"}</div>
													<div className="text-xs text-slate-500">{item.payment?.cardNumberMasked || "-"}</div>
												</td>
												<td className="px-4 py-4 font-black text-[#1475d1]">${item.order?.totalPrice ?? "-"}</td>
												<td className="px-4 py-4 text-xs font-bold text-slate-500">{item.source}</td>
												<td className="px-4 py-4">
													<span className={`inline-flex rounded-full border px-3 py-1 text-xs font-black ${getStatusClass(item.emailDelivery?.status || item.status)}`}>
														{item.emailDelivery?.status || item.status}
													</span>
													{item.lastError ? <div className="mt-2 max-w-[220px] text-xs leading-5 text-red-600">{item.lastError}</div> : null}
												</td>
												<td className="px-4 py-4 text-xs font-bold text-slate-600">{item.emailDelivery?.formcarryStatus || "-"}</td>
												<td className="px-4 py-4 text-xs text-slate-500">{formatDate(item.emailDelivery?.requestSentAt)}</td>
												<td className="px-4 py-4 text-xs text-slate-500">{formatDate(item.emailDelivery?.responseReceivedAt)}</td>
												<td className="px-4 py-4 text-xs font-bold text-slate-600">{formatDuration(item.emailDelivery?.deliveryTimeMs)}</td>
												<td className="px-4 py-4">
													<button
														type="button"
														onClick={() => retryOrder(item)}
														disabled={!canRetry || isRetrying === retryId}
														className="inline-flex items-center gap-2 rounded-full border border-blue-200 px-3 py-2 text-xs font-black text-blue-700 transition hover:bg-blue-50 disabled:cursor-not-allowed disabled:border-slate-200 disabled:text-slate-400"
													>
														<FiRotateCw />
														{isRetrying === retryId ? "جارٍ..." : "إعادة إرسال"}
													</button>
												</td>
											</tr>
										);
									})}
								</tbody>
							</table>
							{!filteredOrders.length ? (
								<div className="bg-white p-8 text-center text-sm font-semibold text-slate-500">لا توجد طلبات مطابقة.</div>
							) : null}
						</div>
					) : null}
				</section>
			</div>
		</main>
	);
}

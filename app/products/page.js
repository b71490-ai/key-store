"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import axios from "axios";
import Swal from "sweetalert2";
import { FiArrowRight, FiKey, FiRefreshCw, FiShield, FiShoppingCart, FiTag } from "react-icons/fi";

const productVisuals = {
	windows: "/images/real/laptop.jpg",
	microsoft: "/images/real/code-screen.jpg",
	adobe: "/images/real/chip.jpg",
	steam: "/images/real/dev-setup.jpg",
	default: "/images/real/dev-setup.jpg",
};

function getProductImage(platform = "") {
	const key = platform.toLowerCase();
	return productVisuals[key] || productVisuals.default;
}

export default function ProductsPage() {
	const router = useRouter();
	const [items, setItems] = useState([]);
	const [total, setTotal] = useState(0);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState("");
	const [titleTapCount, setTitleTapCount] = useState(0);
	const tapResetTimeoutRef = useRef(null);

	const handleTitleTap = async () => {
		if (tapResetTimeoutRef.current) {
			clearTimeout(tapResetTimeoutRef.current);
		}

		const nextCount = titleTapCount + 1;

		if (nextCount >= 5) {
			setTitleTapCount(0);
			await Swal.fire({
				title: "تم فتح لوحة التحكم",
				text: "الآن سيتم تحويلك إلى تسجيل دخول الأدمن.",
				icon: "success",
				confirmButtonText: "متابعة",
				confirmButtonColor: "#1475d1",
			});
			router.push("/admin");
			return;
		}

		setTitleTapCount(nextCount);
		tapResetTimeoutRef.current = setTimeout(() => {
			setTitleTapCount(0);
		}, 1800);
	};

	const fetchItems = async () => {
		try {
			setLoading(true);
			setError("");
			const response = await axios.get("/api/keys");
			setItems(response.data.data ?? []);
			setTotal(response.data.count ?? 0);
		} catch {
			setError("تعذر تحميل المنتجات حاليًا.");
		} finally {
			setLoading(false);
		}
	};

	useEffect(() => {
		fetchItems();
	}, []);

	useEffect(() => {
		return () => {
			if (tapResetTimeoutRef.current) {
				clearTimeout(tapResetTimeoutRef.current);
			}
		};
	}, []);

	return (
		<main className="min-h-screen bg-[#f4f4f5] pb-14 text-slate-800" dir="rtl">
			<div className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-4 pt-8">
				<section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-[0_20px_55px_-35px_rgba(0,0,0,0.35)]">
					<div className="grid gap-6 p-6 md:p-8">
						<div>
							<div className="inline-flex items-center gap-2 rounded-full bg-blue-50 px-4 py-2 text-sm font-semibold text-[#1475d1]">
								<FiTag />
								Catalog
							</div>
							<h1
								onClick={handleTitleTap}
								className="page-title mt-4 cursor-pointer select-none tracking-tight"
							>
								المنتجات الرقمية
							</h1>
							<p className="mt-4 max-w-2xl text-base leading-8 text-slate-500">
								استعرض مفاتيح التفعيل والاشتراكات بأفضل الأسعار. البيانات تأتي مباشرة من API داخلية.
							</p>
							<div className="mt-5 inline-flex rounded-full border border-[#1475d1]/20 bg-[#1475d1]/5 px-4 py-2 text-sm font-semibold text-[#1475d1]">
								عدد المنتجات المتاحة: {total}
							</div>
						</div>
						<div className="flex flex-wrap items-center justify-start gap-3 md:justify-start">
							<button
								type="button"
								onClick={fetchItems}
								className="inline-flex items-center gap-2 rounded-full border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
							>
								<FiRefreshCw />
								تحديث
							</button>
							<Link
								href="/checkout"
								className="inline-flex items-center gap-2 rounded-full bg-[#1475d1] px-5 py-3 text-sm font-bold text-white transition hover:bg-[#0f5ca8]"
							>
								<FiShoppingCart />
								الانتقال للدفع
							</Link>
						</div>
					</div>
				</section>

				{loading ? (
					<div className="rounded-3xl border border-slate-200 bg-white p-6 text-slate-500 shadow-sm">
						جاري تحميل المنتجات...
					</div>
				) : null}

				{error ? (
					<div className="rounded-3xl border border-red-300 bg-red-50 p-6 text-red-700">
						{error}
					</div>
				) : null}

				{!loading ? (
					<section className="products-grid">
						{items.map((item, index) => (
							<article
								key={item.id}
								className="product-card fade-in border border-slate-200 text-slate-900"
							>
								<div className="relative aspect-[16/10] overflow-hidden rounded-2xl bg-slate-100">
									<span className="badge">الأكثر مبيعاً</span>
									<Image
										src={item.image || getProductImage(item.platform)}
										alt={item.productName}
										fill
										sizes="(max-width: 768px) 100vw, (max-width: 1280px) 50vw, 220px"
										priority={index === 0}
										loading={index === 0 ? "eager" : "lazy"}
										className="product-image"
									/>
								</div>

								<div className="product-content p-6">
									<div className="flex items-start justify-between gap-4">
										<div>
											<div className="inline-flex rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-[#1475d1]">
												{item.platform}
											</div>
											<h2 className="product-title tracking-tight">{item.productName}</h2>
										</div>
										<FiKey className="text-2xl text-[#1475d1]" />
									</div>

									<p className="product-desc">{item.description}</p>

									<div className="product-footer">
										<div className="flex items-center justify-between rounded-2xl bg-slate-50 px-4 py-3">
											<span className="text-sm text-slate-500">السعر</span>
											<span className="price product-price">{item.price}</span>
										</div>

										<div className="flex items-center justify-between text-sm text-slate-500">
											<span>المخزون: {item.stock}</span>
											<span>{item.delivery}</span>
										</div>

										<div className="flex items-center gap-2 text-sm font-semibold text-emerald-700">
											<FiShield />
											{item.guarantee}
										</div>

										<Link
											href={{
												pathname: "/checkout",
												query: {
													product: item.productName,
													price: item.price,
													image: item.image || getProductImage(item.platform),
												},
											}}
											className="buy-btn inline-flex w-full items-center justify-center gap-2 text-sm"
										>
											إكمال الشراء
											<FiArrowRight />
										</Link>
									</div>
								</div>
							</article>
						))}
					</section>
				) : null}

				{!loading && !items.length ? (
					<div className="rounded-3xl border border-dashed border-slate-300 bg-white p-8 text-center text-slate-500">
						لا توجد منتجات بعد. أضف منتجًا جديدًا من صفحة الإدارة.
					</div>
				) : null}
			</div>
		</main>
	);
}

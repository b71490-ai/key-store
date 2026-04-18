"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import axios from "axios";
import Swal from "sweetalert2";
import {
	FiArrowRight,
	FiKey,
	FiRefreshCw,
	FiShield,
	FiShoppingCart,
	FiTag,
	FiTrendingUp,
	FiZap,
} from "react-icons/fi";

const productVisuals = {
	windows: "/images/real/laptop.jpg",
	microsoft: "/images/real/code-screen.jpg",
	adobe: "/images/real/chip.jpg",
	steam: "/images/real/dev-setup.jpg",
	default: "/images/real/dev-setup.jpg",
};

const defaultAdSettings = {
	sectionTitle: "إعلانات وعروض من نفس المنتجات",
	badgeText: "عرض متحرك",
	autoRotateEnabled: true,
	autoRotateMs: 3800,
	pauseOnHover: true,
	maxAds: 4,
	showProgress: true,
	showThumbnails: true,
};

function getProductImage(platform = "") {
	const key = platform.toLowerCase();
	return productVisuals[key] || productVisuals.default;
}

function parsePrice(value) {
	const cleaned = String(value ?? "").replace(/[^\d.]/g, "");
	const num = Number(cleaned);
	return Number.isFinite(num) ? num : 0;
}

function formatPrice(value) {
	const price = parsePrice(value);
	return `${price.toFixed(2)}$`;
}

function getAdImageSource(item) {
	const raw = String(item?.image || "");
	const fallback = getProductImage(item?.platform);

	// Some browsers/devices may fail to render AVIF in slider contexts.
	if (!raw || raw.toLowerCase().endsWith(".avif")) {
		return fallback;
	}

	return raw;
}

export default function ProductsPage() {
	const router = useRouter();
	const [items, setItems] = useState([]);
	const [total, setTotal] = useState(0);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState("");
	const [searchQuery, setSearchQuery] = useState("");
	const [selectedPlatform, setSelectedPlatform] = useState("all");
	const [sortBy, setSortBy] = useState("featured");
	const [adSettings, setAdSettings] = useState(defaultAdSettings);
	const [activeAdIndex, setActiveAdIndex] = useState(0);
	const [isAdPaused, setIsAdPaused] = useState(false);
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
			const [productsResponse, adSettingsResponse] = await Promise.allSettled([
				axios.get("/api/keys"),
				axios.get("/api/ad-settings"),
			]);

			if (productsResponse.status !== "fulfilled") {
				throw new Error("products-fetch-failed");
			}

			setItems(productsResponse.value.data?.data ?? []);
			setTotal(productsResponse.value.data?.count ?? 0);
			setAdSettings(
				adSettingsResponse.status === "fulfilled"
					? {
						...defaultAdSettings,
						...(adSettingsResponse.value.data?.data ?? {}),
					}
					: defaultAdSettings
			);
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

	const platformOptions = useMemo(() => {
		const values = Array.from(new Set(items.map((item) => String(item.platform || "").trim()).filter(Boolean)));
		return values;
	}, [items]);

	const filteredItems = useMemo(() => {
		const query = searchQuery.trim().toLowerCase();
		let nextItems = [...items];

		if (selectedPlatform !== "all") {
			nextItems = nextItems.filter((item) => String(item.platform || "").toLowerCase() === selectedPlatform.toLowerCase());
		}

		if (query) {
			nextItems = nextItems.filter((item) => {
				const name = String(item.productName || "").toLowerCase();
				const description = String(item.description || "").toLowerCase();
				const platform = String(item.platform || "").toLowerCase();
				return name.includes(query) || description.includes(query) || platform.includes(query);
			});
		}

		nextItems.sort((a, b) => {
			if (sortBy === "price-asc") return parsePrice(a.price) - parsePrice(b.price);
			if (sortBy === "price-desc") return parsePrice(b.price) - parsePrice(a.price);
			if (sortBy === "name") return String(a.productName || "").localeCompare(String(b.productName || ""), "ar");
			return (Number(b.stock) || 0) - (Number(a.stock) || 0);
		});

		return nextItems;
	}, [items, searchQuery, selectedPlatform, sortBy]);

	const visibleTotal = filteredItems.length;

	const featuredProducts = [...filteredItems]
		.sort((a, b) => parsePrice(a.price) - parsePrice(b.price))
		.slice(0, 4);

	const configuredAds = [...items]
		.filter((item) => Boolean(item.isAdEnabled))
		.sort((a, b) => {
			const aPriority = Number(a.adPriority ?? 999);
			const bPriority = Number(b.adPriority ?? 999);
			if (aPriority !== bPriority) return aPriority - bPriority;
			return parsePrice(b.price) - parsePrice(a.price);
		});

	const adProducts = configuredAds.length
		? configuredAds.slice(0, adSettings.maxAds)
		: [...items]
			.sort((a, b) => parsePrice(b.price) - parsePrice(a.price))
			.slice(0, adSettings.maxAds);

	useEffect(() => {
		setActiveAdIndex(0);
	}, [adProducts.length]);

	useEffect(() => {
		if (adProducts.length <= 1) return undefined;
		if (!adSettings.autoRotateEnabled) return undefined;
		if (isAdPaused) return undefined;

		const intervalId = setInterval(() => {
			setActiveAdIndex((prev) => (prev + 1) % adProducts.length);
		}, adSettings.autoRotateMs);

		return () => clearInterval(intervalId);
	}, [adProducts.length, adSettings.autoRotateEnabled, adSettings.autoRotateMs, isAdPaused]);

	const goToAd = (nextIndex) => {
		if (!adProducts.length) return;
		const normalized = ((nextIndex % adProducts.length) + adProducts.length) % adProducts.length;
		setActiveAdIndex(normalized);
	};

	const activeAd = adProducts[activeAdIndex] || adProducts[0] || null;

	return (
		<main className="catalog-shell min-h-screen pb-16 text-slate-800" dir="rtl">
			<div className="catalog-bg-orb catalog-bg-orb-one" aria-hidden="true" />
			<div className="catalog-bg-orb catalog-bg-orb-two" aria-hidden="true" />
			<div className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-4 pt-8">
				<section className="catalog-hero overflow-hidden rounded-3xl border border-slate-200 shadow-[0_28px_80px_-40px_rgba(15,23,42,0.6)]">
					<div className="grid gap-8 p-6 md:grid-cols-[1.3fr_0.7fr] md:p-8">
						<div>
							<div className="inline-flex items-center gap-2 rounded-full bg-white/70 px-4 py-2 text-sm font-semibold text-[#0f5ca8]">
								<FiTag />
								كتالوج احترافي
							</div>
							<h1
								onClick={handleTitleTap}
								className="page-title mt-4 cursor-pointer select-none tracking-tight"
							>
								منتجات رقمية جاهزة للتفعيل الفوري
							</h1>
							<p className="mt-4 max-w-2xl text-base leading-8 text-slate-600">
								واجهة عرض مطورة بتركيز على الوضوح وسرعة الشراء، مع عروض دعائية ديناميكية من نفس المنتجات داخل الصفحة.
							</p>

							<div className="mt-6 grid gap-3 sm:grid-cols-3">
								<div className="hero-kpi">
									<span>إجمالي المنتجات</span>
									<strong>{total}</strong>
								</div>
								<div className="hero-kpi">
									<span>نتائج العرض</span>
									<strong>{visibleTotal}</strong>
								</div>
								<div className="hero-kpi">
									<span>إعلانات نشطة</span>
									<strong>{adProducts.length}</strong>
								</div>
							</div>

							<div className="mt-7 flex flex-wrap items-center gap-3">
								<button
									type="button"
									onClick={fetchItems}
									className="inline-flex items-center gap-2 rounded-full border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
								>
									<FiRefreshCw />
									تحديث المنتجات
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

						<div className="catalog-hero-side rounded-2xl border border-white/60 bg-white/70 p-4 backdrop-blur">
							<div className="mb-3 inline-flex items-center gap-2 rounded-full bg-[#0f172a] px-3 py-1 text-xs font-bold text-white">
								<FiTrendingUp />
								الأكثر طلبًا
							</div>
							<div className="space-y-3">
								{featuredProducts.slice(0, 3).map((item) => (
									<div key={item.id} className="hero-side-product">
										<div>
											<p className="text-sm font-bold text-slate-800">{item.productName}</p>
											<p className="text-xs text-slate-500">{item.platform}</p>
										</div>
										<span className="text-sm font-extrabold text-[#0f5ca8]">{formatPrice(item.price)}</span>
									</div>
								))}
							</div>
						</div>
					</div>
				</section>

				<section className="filter-bar rounded-2xl border border-slate-200 bg-white/85 p-4 shadow-[0_14px_40px_-30px_rgba(15,23,42,0.45)] backdrop-blur">
					<div className="grid gap-3 md:grid-cols-[1.2fr_0.9fr_0.9fr]">
						<input
							type="text"
							value={searchQuery}
							onChange={(event) => setSearchQuery(event.target.value)}
							placeholder="ابحث باسم المنتج أو المنصة"
							className="h-12 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 outline-none transition focus:border-[#1475d1]"
						/>

						<select
							value={selectedPlatform}
							onChange={(event) => setSelectedPlatform(event.target.value)}
							className="h-12 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700 outline-none transition focus:border-[#1475d1]"
						>
							<option value="all">كل المنصات</option>
							{platformOptions.map((platform) => (
								<option key={platform} value={platform}>{platform}</option>
							))}
						</select>

						<select
							value={sortBy}
							onChange={(event) => setSortBy(event.target.value)}
							className="h-12 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700 outline-none transition focus:border-[#1475d1]"
						>
							<option value="featured">ترتيب افتراضي (حسب المخزون)</option>
							<option value="price-asc">السعر: الأقل أولًا</option>
							<option value="price-desc">السعر: الأعلى أولًا</option>
							<option value="name">الاسم: من الألف إلى الياء</option>
						</select>
					</div>
				</section>

				{!loading && adProducts.length ? (
					<section
						className="promo-rail rounded-3xl border border-slate-200 p-5 shadow-[0_18px_50px_-35px_rgba(15,23,42,0.4)]"
						onMouseEnter={() => {
							if (adSettings.pauseOnHover) setIsAdPaused(true);
						}}
						onMouseLeave={() => {
							if (adSettings.pauseOnHover) setIsAdPaused(false);
						}}
					>
						<div className="mb-4 flex items-center justify-between gap-3">
							<h2 className="text-xl font-extrabold tracking-tight text-slate-900">{adSettings.sectionTitle}</h2>
							<span className="inline-flex items-center gap-2 rounded-full bg-[#1d4ed8]/10 px-3 py-1 text-xs font-bold text-[#1d4ed8]">
								<FiZap />
								{isAdPaused && adSettings.pauseOnHover ? "تم إيقاف الحركة مؤقتًا" : adSettings.badgeText}
							</span>
						</div>
						{adSettings.showProgress ? (
						<div className="promo-progress" aria-hidden="true">
							{adProducts.map((item, index) => (
								<span key={`progress-${item.id}`} className={`promo-progress-item ${index === activeAdIndex ? "is-active" : ""}`} />
							))}
						</div>
						) : null}
						<div className="promo-carousel-wrap">
							{activeAd ? (
								<div key={`active-ad-${activeAd.id}`} className="promo-slide promo-active-fade">
									{(() => {
										const adImageSrc = getAdImageSource(activeAd);
										return (
											<Link
												href={{
													pathname: "/checkout",
													query: {
														product: activeAd.productName,
														price: activeAd.price,
														image: adImageSrc,
													},
												}}
												className="promo-card promo-image-card"
											>
												<Image
													src={adImageSrc}
													alt={activeAd.productName}
													fill
													loading="eager"
													priority
													sizes="(max-width: 768px) 100vw, 1100px"
													className="promo-media"
													onError={(event) => {
														event.currentTarget.src = getProductImage(activeAd.platform);
													}}
												/>
												<div className="promo-overlay" />
												<div className="promo-content-wrap">
													<p className="promo-label">إعلان مميز</p>
													<h3 className="promo-title promo-title-light">{activeAd.productName}</h3>
													<p className="promo-desc promo-desc-light">{activeAd.description}</p>
													<div className="mt-3 flex items-center justify-between">
														<span className="rounded-full bg-white/90 px-3 py-1 text-xs font-semibold text-slate-800">{activeAd.platform}</span>
														<span className="promo-price promo-price-light">{formatPrice(activeAd.price)}</span>
													</div>
													<div className="mt-3 inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-xs font-semibold text-white backdrop-blur-sm">
														اضغط لمشاهدة المنتج والشراء
														<FiArrowRight />
													</div>
												</div>
											</Link>
										);
									})()}
								</div>
							) : null}
						</div>
						<div className="promo-carousel-controls">
							<button type="button" onClick={() => goToAd(activeAdIndex - 1)} className="promo-nav-btn">السابق</button>
							<div className="promo-dots" role="tablist" aria-label="التنقل بين الإعلانات">
								{adProducts.map((item, index) => (
									<button
										type="button"
										key={`dot-${item.id}`}
										onClick={() => goToAd(index)}
										className={`promo-dot ${index === activeAdIndex ? "is-active" : ""}`}
										aria-label={`اذهب للإعلان رقم ${index + 1}`}
									/>
								))}
							</div>
							<button type="button" onClick={() => goToAd(activeAdIndex + 1)} className="promo-nav-btn">التالي</button>
						</div>
						{adSettings.showThumbnails ? (
						<div className="promo-thumbs" role="list" aria-label="صور الإعلانات">
							{adProducts.map((item, index) => {
								const thumbImageSrc = getAdImageSource(item);
								return (
								<button
									type="button"
									key={`thumb-${item.id}`}
									onClick={() => goToAd(index)}
									className={`promo-thumb ${index === activeAdIndex ? "is-active" : ""}`}
									aria-label={`فتح إعلان ${item.productName}`}
								>
									<Image
										src={thumbImageSrc}
										alt={item.productName}
										fill
										loading="eager"
										sizes="120px"
										className="promo-thumb-image"
										onError={(event) => {
											event.currentTarget.src = getProductImage(item.platform);
										}}
									/>
								</button>
								);
							})}
						</div>
						) : null}
					</section>
				) : null}

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
						{filteredItems.map((item, index) => (
							<article
								key={item.id}
								className="product-card fade-in border border-slate-200 text-slate-900"
								style={{ animationDelay: `${index * 70}ms` }}
							>
								<div className="relative aspect-[16/10] overflow-hidden rounded-2xl bg-slate-100">
									<span className="badge">عرض مباشر</span>
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
											<span className="product-price">{formatPrice(item.price)}</span>
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

				{!loading && !filteredItems.length ? (
					<div className="rounded-3xl border border-dashed border-slate-300 bg-white p-8 text-center text-slate-500">
						لا توجد نتائج مطابقة الآن. غيّر البحث أو الفلاتر وجرب مرة ثانية.
					</div>
				) : null}
			</div>
		</main>
	);
}

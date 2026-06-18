"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import axios from "axios";
import { motion } from "framer-motion";
import StoreNav from "../components/StoreNav";
import {
	FiArrowRight,
	FiAward,
	FiCheckCircle,
	FiClock,
	FiCreditCard,
	FiFilter,
	FiHeadphones,
	FiRefreshCw,
	FiSearch,
	FiShield,
	FiShoppingCart,
	FiStar,
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
	sectionTitle: "عروض رقمية مختارة لهذا اليوم",
	badgeText: "Premium Deal",
	autoRotateEnabled: true,
	autoRotateMs: 3600,
	pauseOnHover: true,
	maxAds: 4,
	showProgress: true,
	showThumbnails: true,
};

const trustBadges = [
	{ label: "تفعيل فوري", icon: FiZap },
	{ label: "ضمان استبدال", icon: FiShield },
	{ label: "دعم 24/7", icon: FiHeadphones },
	{ label: "دفع آمن", icon: FiCreditCard },
];

const reviews = [
	{ name: "محمد ع.", role: "مستخدم Windows", text: "التفعيل وصل بسرعة، والواجهة أوضحت كل شيء قبل الشراء.", rating: 5 },
	{ name: "نورا س.", role: "مصممة", text: "العروض واضحة والبطاقات منظمة جدًا. تجربة تشبه المتاجر العالمية.", rating: 5 },
	{ name: "خالد م.", role: "صاحب متجر", text: "أعجبني ترتيب المنتجات وسهولة المقارنة بين المنصات.", rating: 5 },
];

const faqs = [
	["متى يصل المنتج؟", "تظهر طريقة التسليم داخل كل بطاقة، ومعظم المنتجات مهيأة للتسليم الفوري أو خلال دقائق."],
	["هل توجد ضمانات؟", "كل منتج يعرض الضمان الخاص به، مع دعم للاستبدال حسب سياسة المنتج."],
	["هل أستطيع مراجعة الطلب قبل الدفع؟", "نعم، صفحة الدفع تعرض ملخصًا واضحًا للمنتج والرسوم والبطاقة بشكل مخفي."],
	["هل المنتجات أصلية؟", "الصفحة تعرض المنتجات الرقمية المخزنة في النظام مع تفاصيل المنصة والضمان والتسليم."],
];

const containerVariants = {
	hidden: { opacity: 0 },
	show: {
		opacity: 1,
		transition: { staggerChildren: 0.055 },
	},
};

const itemVariants = {
	hidden: { opacity: 0, y: 18 },
	show: { opacity: 1, y: 0, transition: { duration: 0.42, ease: "easeOut" } },
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
	return `${parsePrice(value).toFixed(2)}$`;
}

function getSeed(item) {
	return Number(item?.id || 1);
}

function getSoldCount(item) {
	return 120 + (getSeed(item) * 37) % 940;
}

function getRating(item) {
	return (4.6 + ((getSeed(item) % 4) * 0.1)).toFixed(1);
}

function getDiscount(item) {
	return 12 + (getSeed(item) % 5) * 4;
}

function getAdImageSource(item) {
	const raw = String(item?.image || "");
	const fallback = getProductImage(item?.platform);
	if (!raw || raw.toLowerCase().endsWith(".avif")) return fallback;
	return raw;
}

function ProductSkeleton() {
	return (
		<div className="market-product-card skeleton-card">
			<div className="skeleton-block aspect-[4/3]" />
			<div className="mt-4 space-y-3">
				<div className="skeleton-line w-2/3" />
				<div className="skeleton-line w-full" />
				<div className="skeleton-line w-1/2" />
			</div>
		</div>
	);
}

export default function ProductsPage() {
	const [items, setItems] = useState([]);
	const [total, setTotal] = useState(0);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState("");
	const [searchQuery, setSearchQuery] = useState("");
	const [selectedPlatform, setSelectedPlatform] = useState("all");
	const [sortBy, setSortBy] = useState("best-selling");
	const [adSettings, setAdSettings] = useState(defaultAdSettings);
	const [activeAdIndex, setActiveAdIndex] = useState(0);
	const [isAdPaused, setIsAdPaused] = useState(false);
	const [buyingId, setBuyingId] = useState(null);

	const fetchItems = async () => {
		try {
			setLoading(true);
			setError("");
			const [productsResponse, adSettingsResponse] = await Promise.allSettled([
				axios.get("/api/keys"),
				axios.get("/api/ad-settings"),
			]);

			if (productsResponse.status !== "fulfilled") throw new Error("products-fetch-failed");

			setItems(productsResponse.value.data?.data ?? []);
			setTotal(productsResponse.value.data?.count ?? 0);
			setAdSettings(
				adSettingsResponse.status === "fulfilled"
					? { ...defaultAdSettings, ...(adSettingsResponse.value.data?.data ?? {}) }
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

	const platformOptions = useMemo(() => {
		return Array.from(new Set(items.map((item) => String(item.platform || "").trim()).filter(Boolean)));
	}, [items]);

	const filteredItems = useMemo(() => {
		const query = searchQuery.trim().toLowerCase();
		let nextItems = [...items];

		if (selectedPlatform !== "all") {
			nextItems = nextItems.filter((item) => String(item.platform || "").toLowerCase() === selectedPlatform.toLowerCase());
		}

		if (query) {
			nextItems = nextItems.filter((item) => {
				const source = `${item.productName || ""} ${item.description || ""} ${item.platform || ""}`.toLowerCase();
				return source.includes(query);
			});
		}

		nextItems.sort((a, b) => {
			if (sortBy === "price-asc") return parsePrice(a.price) - parsePrice(b.price);
			if (sortBy === "price-desc") return parsePrice(b.price) - parsePrice(a.price);
			if (sortBy === "rating") return Number(getRating(b)) - Number(getRating(a));
			if (sortBy === "newest") return Number(b.id || 0) - Number(a.id || 0);
			return getSoldCount(b) - getSoldCount(a);
		});

		return nextItems;
	}, [items, searchQuery, selectedPlatform, sortBy]);

	const configuredAds = [...items]
		.filter((item) => Boolean(item.isAdEnabled))
		.sort((a, b) => Number(a.adPriority ?? 999) - Number(b.adPriority ?? 999));

	const adProducts = (configuredAds.length ? configuredAds : [...items].sort((a, b) => getSoldCount(b) - getSoldCount(a))).slice(0, adSettings.maxAds);
	const activeAd = adProducts[activeAdIndex] || adProducts[0] || null;

	const liveOrders = 2400 + items.length * 19;
	const soldProducts = items.reduce((sum, item) => sum + getSoldCount(item), 0);
	const customerSatisfaction = "98.7%";

	useEffect(() => {
		setActiveAdIndex(0);
	}, [adProducts.length]);

	useEffect(() => {
		if (adProducts.length <= 1 || !adSettings.autoRotateEnabled || isAdPaused) return undefined;
		const intervalId = setInterval(() => {
			setActiveAdIndex((prev) => (prev + 1) % adProducts.length);
		}, adSettings.autoRotateMs);
		return () => clearInterval(intervalId);
	}, [adProducts.length, adSettings.autoRotateEnabled, adSettings.autoRotateMs, isAdPaused]);

	const handleBuyClick = (id) => {
		setBuyingId(id);
		setTimeout(() => setBuyingId(null), 900);
	};

	return (
		<main className="market-shell min-h-screen pb-14 text-slate-900" dir="rtl">
			<StoreNav />

			<section className="market-offer-strip">
				<div className="market-offer-track">
					<span>عروض اليوم حتى 40% على مفاتيح Windows و Office</span>
					<span>مبيعات مباشرة الآن: {soldProducts.toLocaleString("en-US")}</span>
					<span>تفعيل فوري وضمان استبدال ودعم مستمر</span>
					<span>عروض اليوم حتى 40% على مفاتيح Windows و Office</span>
				</div>
			</section>

			<div className="mx-auto flex w-full max-w-[1480px] flex-col gap-5 px-4 pt-24 lg:px-6">
				<section className="market-hero">
					<div className="market-hero-glow" />
					<motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="relative z-10 grid gap-6 lg:grid-cols-[1.15fr_0.85fr] lg:items-center">
						<div>
							<div className="premium-eyebrow">
								<FiAward />
								Digital Marketplace 2026
							</div>
							<h1 className="mt-4 max-w-4xl text-4xl font-black leading-tight text-slate-950 sm:text-5xl lg:text-6xl dark-aware-text">
								اشتر مفاتيحك الرقمية بثقة وسرعة من واجهة Premium مصممة للتحويل
							</h1>
							<p className="mt-4 max-w-3xl text-base leading-8 text-slate-600 dark-aware-muted">
								عروض فورية، بطاقات واضحة، تقييمات، ضمانات، وفلاتر ذكية تساعدك تختار المنتج المناسب في ثوانٍ.
							</p>
							<div className="mt-6 flex flex-wrap gap-3">
								<a href="#products" className="market-cta market-cta-primary">
									ابدأ الشراء الآن
									<FiShoppingCart />
								</a>
								<a href="#offers" className="market-cta market-cta-secondary">
									مشاهدة العروض
									<FiArrowRight />
								</a>
							</div>
							<div className="mt-5 grid gap-2 sm:grid-cols-4">
								{trustBadges.map((badge) => {
									const Icon = badge.icon;
									return (
										<div key={badge.label} className="market-trust-badge">
											<Icon />
											{badge.label}
										</div>
									);
								})}
							</div>
						</div>
						<div className="market-hero-stats">
							<div className="market-live-stat">
								<span>طلبات مباشرة</span>
								<strong>{liveOrders.toLocaleString("en-US")}</strong>
							</div>
							<div className="market-live-stat">
								<span>منتجات مباعة</span>
								<strong>{soldProducts.toLocaleString("en-US")}</strong>
							</div>
							<div className="market-live-stat">
								<span>رضا العملاء</span>
								<strong>{customerSatisfaction}</strong>
							</div>
						</div>
					</motion.div>
				</section>

				{!loading && activeAd ? (
					<section
						id="offers"
						className="market-premium-banner"
						onMouseEnter={() => {
							if (adSettings.pauseOnHover) setIsAdPaused(true);
						}}
						onMouseLeave={() => {
							if (adSettings.pauseOnHover) setIsAdPaused(false);
						}}
					>
						<div className="relative min-h-[320px] overflow-hidden rounded-[28px]">
							<Image
								src={getAdImageSource(activeAd)}
								alt={activeAd.productName}
								fill
								priority
								sizes="(max-width: 768px) 100vw, 1480px"
								className="market-banner-image"
							/>
							<div className="market-banner-overlay" />
							<motion.div key={activeAd.id} initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} className="market-banner-content">
								<div className="premium-eyebrow bg-white/15 text-white">
									<FiZap />
									{adSettings.badgeText}
								</div>
								<h2>{activeAd.productName}</h2>
								<p>{activeAd.description}</p>
								<div className="mt-4 flex flex-wrap items-center gap-3">
									<span className="market-banner-price">{formatPrice(activeAd.price)}</span>
									<Link
										href={{
											pathname: "/checkout",
											query: {
												product: activeAd.productName,
												price: activeAd.price,
												image: getAdImageSource(activeAd),
											},
										}}
										className="market-cta market-cta-primary"
									>
										شراء العرض
										<FiArrowRight />
									</Link>
								</div>
							</motion.div>
							<div className="market-banner-dots">
								{adProducts.map((item, index) => (
									<button
										type="button"
										key={item.id}
										onClick={() => setActiveAdIndex(index)}
										className={index === activeAdIndex ? "is-active" : ""}
										aria-label={`عرض ${index + 1}`}
									/>
								))}
							</div>
						</div>
					</section>
				) : null}

				<section className="market-filter-panel">
					<div className="relative min-w-0 flex-1">
						<FiSearch className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-slate-400" />
						<input
							type="search"
							value={searchQuery}
							onChange={(event) => setSearchQuery(event.target.value)}
							placeholder="ابحث عن Windows, Office, Adobe, Steam..."
							className="market-search-input"
						/>
					</div>
					<div className="market-select-wrap">
						<FiFilter />
						<select value={selectedPlatform} onChange={(event) => setSelectedPlatform(event.target.value)}>
							<option value="all">كل المنصات</option>
							{platformOptions.map((platform) => (
								<option key={platform} value={platform}>{platform}</option>
							))}
						</select>
					</div>
					<div className="market-select-wrap">
						<FiTrendingUp />
						<select value={sortBy} onChange={(event) => setSortBy(event.target.value)}>
							<option value="best-selling">الأكثر مبيعًا</option>
							<option value="rating">الأعلى تقييمًا</option>
							<option value="newest">الأحدث</option>
							<option value="price-asc">الأقل سعرًا</option>
							<option value="price-desc">الأعلى سعرًا</option>
						</select>
					</div>
					<button type="button" onClick={fetchItems} className="market-refresh-btn">
						<FiRefreshCw />
						تحديث
					</button>
				</section>

				{error ? <div className="rounded-2xl border border-red-200 bg-red-50 p-5 font-bold text-red-700">{error}</div> : null}

				<section id="products">
					<div className="mb-4 flex flex-wrap items-end justify-between gap-3">
						<div>
							<p className="premium-eyebrow"><FiShoppingCart /> {filteredItems.length} نتيجة من {total}</p>
							<h2 className="mt-2 text-3xl font-black dark-aware-text">منتجات مختارة للتحويل السريع</h2>
						</div>
					</div>

					{loading ? (
						<div className="market-products-grid">
							{Array.from({ length: 8 }).map((_, index) => <ProductSkeleton key={index} />)}
						</div>
					) : (
						<motion.div variants={containerVariants} initial="hidden" animate="show" className="market-products-grid">
							{filteredItems.map((item, index) => {
								const image = item.image || getProductImage(item.platform);
								const isBuying = buyingId === item.id;
								return (
									<motion.article key={item.id} variants={itemVariants} className="market-product-card">
										<div className="market-product-media">
											<Image
												src={image}
												alt={item.productName}
												fill
												sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
												priority={index < 2}
												loading={index < 2 ? "eager" : "lazy"}
												className="market-product-image"
											/>
											<div className="market-card-badges">
												{index < 3 ? <span className="hot">الأكثر مبيعًا</span> : null}
												{Number(item.id || 0) % 2 === 0 ? <span>جديد</span> : null}
												{Number(item.stock || 0) <= 12 ? <span className="limited">محدود الكمية</span> : null}
											</div>
											<span className="market-discount">-{getDiscount(item)}%</span>
										</div>

										<div className="market-product-body">
											<div className="flex items-center justify-between gap-3">
												<span className="market-platform-pill">{item.platform}</span>
												<span className="market-stars"><FiStar /> {getRating(item)}</span>
											</div>
											<h3>{item.productName}</h3>
											<p>{item.description}</p>
											<div className="market-product-meta">
												<span><FiCheckCircle /> {getSoldCount(item)} عملية بيع</span>
												<span><FiClock /> {item.delivery}</span>
											</div>
											<div className="market-price-row">
												<div>
													<span>السعر</span>
													<strong>{formatPrice(item.price)}</strong>
												</div>
												<span className="market-stock">المخزون {item.stock}</span>
											</div>
											<div className="grid gap-2">
												<Link href={`/products/${item.id}`} className="market-secondary-btn">عرض التفاصيل</Link>
												<Link
													href={{
														pathname: "/checkout",
														query: {
															product: item.productName,
															price: item.price,
															image,
														},
													}}
													onClick={() => handleBuyClick(item.id)}
													className={`market-buy-btn ${isBuying ? "is-loading" : ""}`}
												>
													<span>{isBuying ? "جارٍ التحضير..." : "شراء الآن"}</span>
													<FiArrowRight />
												</Link>
											</div>
										</div>
									</motion.article>
								);
							})}
						</motion.div>
					)}

					{!loading && !filteredItems.length ? (
						<div className="mt-5 rounded-3xl border border-dashed border-slate-300 bg-white/80 p-8 text-center font-bold text-slate-500">
							لا توجد نتائج مطابقة. جرّب فلترًا آخر أو غيّر كلمة البحث.
						</div>
					) : null}
				</section>

				<section className="market-proof-grid">
					<div className="market-proof-card">
						<h2>لماذا نحن؟</h2>
						<p>تجربة شراء رقمية مركزة على السرعة، وضوح السعر، وضمانات ما بعد الشراء.</p>
						<div className="mt-4 grid gap-2 sm:grid-cols-2">
							{trustBadges.map((badge) => {
								const Icon = badge.icon;
								return <span key={badge.label}><Icon /> {badge.label}</span>;
							})}
						</div>
					</div>
					<div className="market-proof-card">
						<h2>الضمانات</h2>
						<p>عرض واضح لحالة المخزون، طريقة التسليم، الضمان، وإعادة المحاولة عند أي تأخير في الإرسال.</p>
					</div>
				</section>

				<section className="market-reviews">
					{reviews.map((review) => (
						<article key={review.name}>
							<div className="flex gap-1 text-amber-400">{Array.from({ length: review.rating }).map((_, index) => <FiStar key={index} />)}</div>
							<p>{review.text}</p>
							<strong>{review.name}</strong>
							<span>{review.role}</span>
						</article>
					))}
				</section>

				<section className="market-faq">
					<h2>الأسئلة الشائعة</h2>
					<div className="grid gap-3 md:grid-cols-2">
						{faqs.map(([question, answer]) => (
							<details key={question} className="faq-item">
								<summary>{question}</summary>
								<p>{answer}</p>
							</details>
						))}
					</div>
				</section>
			</div>
		</main>
	);
}

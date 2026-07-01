"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import axios from "axios";
import StoreNav from "../components/StoreNav";
import {
	FiArrowRight,
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
	windows: "/images/product-art/windows-11-pro-key.svg",
	microsoft: "/images/product-art/office-2021-professional.svg",
	adobe: "/images/product-art/adobe-creative-cloud-1-year.svg",
	steam: "/images/product-art/steam-wallet-20-usd.svg",
	general: "/images/product-art/digital-product.svg",
	default: "/images/product-art/digital-product.svg",
};

const defaultAdSettings = {
	sectionTitle: "عروض رقمية مختارة لهذا اليوم",
	badgeText: "عرض اليوم",
	autoRotateEnabled: true,
	autoRotateMs: 4200,
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
	{ name: "محمد ع.", text: "واجهة واضحة والشراء سريع بدون تعقيد.", rating: 5 },
	{ name: "نورا س.", text: "البطاقات مرتبة والعروض سهلة القراءة.", rating: 5 },
	{ name: "خالد م.", text: "التسليم والضمان ظاهرين قبل الدفع، وهذا مهم.", rating: 5 },
];

const faqs = [
	["متى يصل المنتج؟", "تظهر طريقة التسليم داخل كل بطاقة، ومعظم المنتجات مهيأة للتسليم الفوري أو خلال دقائق."],
	["هل توجد ضمانات؟", "كل منتج يعرض الضمان الخاص به، مع دعم للاستبدال حسب سياسة المنتج."],
	["هل أستطيع مراجعة الطلب قبل الدفع؟", "نعم، صفحة الدفع تعرض ملخصًا واضحًا للمنتج والرسوم والبطاقة بشكل مخفي."],
	["هل المنتجات أصلية؟", "الصفحة تعرض المنتجات الرقمية المخزنة في النظام مع تفاصيل المنصة والضمان والتسليم."],
];

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
	return raw || fallback;
}

function ProductSkeleton() {
	return (
		<div className="stable-product-card">
			<div className="skeleton-block stable-product-image-wrap" />
			<div className="stable-product-body">
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
	const featuredHeroProduct = activeAd || filteredItems[0] || items[0] || null;
	const soldProducts = items.reduce((sum, item) => sum + getSoldCount(item), 0);
	const liveOrders = 2400 + items.length * 19;

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
		setTimeout(() => setBuyingId(null), 800);
	};

	return (
		<main className="stable-products-shell min-h-screen pb-12 text-slate-900" dir="rtl">
			<StoreNav />
			<div className="stable-products-container mx-auto w-full px-4 py-4 md:px-6">
				<section className="stable-offer-bar">
					<strong><FiZap /> عروض اليوم</strong>
					<div className="stable-offer-track grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
						<span>خصومات حتى 40% على المنتجات الرقمية</span>
						<span>مبيعات مباشرة: {soldProducts.toLocaleString("en-US")}</span>
						<span>تفعيل فوري وضمان استبدال</span>
						<span>دعم متواصل وتجربة دفع آمنة</span>
					</div>
				</section>

				<section className="stable-hero">
					<div className="stable-hero-copy">
						<div className="stable-eyebrow">Digital Marketplace</div>
						<h1>منتجات رقمية موثوقة بتجربة شراء Premium مستقرة</h1>
						<p>
							اكتشف مفاتيح Windows وOffice وAdobe وبطاقات الألعاب من شبكة منتجات مرتبة، سريعة، وواضحة قبل الدفع.
						</p>
						<div className="stable-hero-actions">
							<a href="#products" className="stable-primary-btn">
								تصفح المنتجات
								<FiShoppingCart />
							</a>
							<a href="#offers" className="stable-secondary-btn">
								العروض الحالية
								<FiArrowRight />
							</a>
						</div>
						<div className="stable-trust-row">
							{trustBadges.map((badge) => {
								const Icon = badge.icon;
								return (
									<span key={badge.label}>
										<Icon />
										{badge.label}
									</span>
								);
							})}
						</div>
					</div>

					<div className="stable-hero-showcase">
						{featuredHeroProduct ? (
							<div className="stable-showcase-card">
								<div className="stable-showcase-image">
									<Image
										src={getAdImageSource(featuredHeroProduct)}
										alt={featuredHeroProduct.productName}
										fill
										sizes="(max-width: 768px) 90vw, 520px"
										className="stable-showcase-img"
										priority
									/>
								</div>
								<div className="stable-showcase-info">
									<span>الأكثر طلبًا الآن</span>
									<h2>{featuredHeroProduct.productName}</h2>
									<div>
										<strong>{formatPrice(featuredHeroProduct.price)}</strong>
										<small><FiStar /> {getRating(featuredHeroProduct)}</small>
									</div>
								</div>
							</div>
						) : null}

						<div className="stable-hero-stats">
							<div className="stable-stat-card is-featured">
								<span>طلبات مباشرة</span>
								<strong>{liveOrders.toLocaleString("en-US")}</strong>
								<small>نشاط شراء مستمر خلال اليوم</small>
							</div>
							<div className="stable-stat-card">
								<span>منتجات مباعة</span>
								<strong>{soldProducts.toLocaleString("en-US")}</strong>
								<small>مفاتيح رقمية تم تسليمها</small>
							</div>
							<div className="stable-stat-card">
								<span>رضا العملاء</span>
								<strong>98.7%</strong>
								<small>تقييمات موثوقة بعد الشراء</small>
							</div>
						</div>
					</div>
				</section>

				{!loading && activeAd ? (
					<section
						id="offers"
						className="stable-slider"
						onMouseEnter={() => {
							if (adSettings.pauseOnHover) setIsAdPaused(true);
						}}
						onMouseLeave={() => {
							if (adSettings.pauseOnHover) setIsAdPaused(false);
						}}
					>
						<div className="stable-slider-image">
							<Image
								src={getAdImageSource(activeAd)}
								alt={activeAd.productName}
								fill
								loading="lazy"
								sizes="(max-width: 768px) 90vw, (max-width: 1200px) 45vw, 300px"
								className="stable-slider-img"
							/>
						</div>
						<div className="stable-slider-content">
							<span>{adSettings.badgeText}</span>
							<h2>{activeAd.productName}</h2>
							<p>{activeAd.description}</p>
							<div className="stable-slider-meta">
								<span><FiShield /> ضمان استبدال</span>
								<span><FiClock /> تسليم سريع</span>
								<span><FiStar /> {getRating(activeAd)} تقييم</span>
							</div>
							<div className="stable-slider-actions">
								<strong>{formatPrice(activeAd.price)}</strong>
								<Link
									href={{
										pathname: "/checkout",
										query: {
											product: activeAd.productName,
											price: activeAd.price,
											image: getAdImageSource(activeAd),
										},
									}}
									className="stable-primary-btn"
								>
									شراء العرض
									<FiArrowRight />
								</Link>
							</div>
							<div className="stable-slider-dots">
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
							{adProducts.length > 1 ? (
								<div className="stable-offer-thumbnails">
									{adProducts.map((item, index) => (
										<button
											type="button"
											key={`thumb-${item.id}`}
											onClick={() => setActiveAdIndex(index)}
											className={index === activeAdIndex ? "is-active" : ""}
										>
											<span>{item.platform}</span>
											<strong>{formatPrice(item.price)}</strong>
										</button>
									))}
								</div>
							) : null}
						</div>
					</section>
				) : null}

				<section className="stable-filter-panel">
					<div className="stable-search-wrap">
						<FiSearch />
						<input
							type="search"
							value={searchQuery}
							onChange={(event) => setSearchQuery(event.target.value)}
							placeholder="ابحث باسم المنتج أو المنصة"
						/>
					</div>
					<div className="stable-select-wrap">
						<FiFilter />
						<select value={selectedPlatform} onChange={(event) => setSelectedPlatform(event.target.value)}>
							<option value="all">كل المنصات</option>
							{platformOptions.map((platform) => (
								<option key={platform} value={platform}>{platform}</option>
							))}
						</select>
					</div>
					<div className="stable-select-wrap">
						<FiTrendingUp />
						<select value={sortBy} onChange={(event) => setSortBy(event.target.value)}>
							<option value="best-selling">الأكثر مبيعًا</option>
							<option value="rating">الأعلى تقييمًا</option>
							<option value="newest">الأحدث</option>
							<option value="price-asc">الأقل سعرًا</option>
							<option value="price-desc">الأعلى سعرًا</option>
						</select>
					</div>
					<button type="button" onClick={fetchItems} className="stable-refresh-btn">
						<FiRefreshCw />
						تحديث
					</button>
				</section>

				{error ? <div className="stable-error">{error}</div> : null}

				<section id="products" className="stable-products-section">
					<div className="stable-section-heading">
						<div>
							<span>{filteredItems.length} نتيجة من {total}</span>
							<h2>منتجات مختارة ومنظمة</h2>
						</div>
						<p>اختيارات عالية الطلب مع تسليم واضح، تقييمات ظاهرة، وسعر مباشر قبل الدفع.</p>
					</div>

					{loading ? (
						<div className="stable-products-grid">
							{Array.from({ length: 6 }).map((_, index) => <ProductSkeleton key={index} />)}
						</div>
					) : (
						<div className="stable-products-grid">
							{filteredItems.map((item, index) => {
								const image = item.image || getProductImage(item.platform);
								const isBuying = buyingId === item.id;
								return (
									<article key={item.id} className="stable-product-card">
										<div className="stable-product-image-wrap">
											<Image
												src={image}
												alt={item.productName}
												fill
												sizes="(max-width: 768px) 90vw, (max-width: 1200px) 45vw, 300px"
												loading="lazy"
												className="stable-product-image"
											/>
											<div className="stable-product-badges">
												{index < 3 ? <span>الأكثر مبيعًا</span> : null}
												{Number(item.id || 0) % 2 === 0 ? <span>جديد</span> : null}
												{Number(item.stock || 0) <= 12 ? <span>محدود الكمية</span> : null}
											</div>
											<span className="stable-discount">-{getDiscount(item)}%</span>
										</div>

										<div className="stable-product-body">
											<div className="stable-product-topline">
												<span>{item.platform}</span>
												<strong><FiStar /> {getRating(item)}</strong>
											</div>
											<h3>{item.productName}</h3>
											<p>{item.description}</p>
											<div className="stable-product-meta">
												<span><FiCheckCircle /> {getSoldCount(item)} عملية بيع</span>
												<span><FiClock /> {item.delivery}</span>
												<span><FiShield /> {item.guarantee || "ضمان استبدال"}</span>
											</div>
											<div className="stable-price-row">
												<div>
													<span>السعر</span>
													<strong>{formatPrice(item.price)}</strong>
												</div>
												<small>المخزون {item.stock}</small>
											</div>
											<div className="stable-card-actions">
												<Link href={`/products/${item.id}`} className="stable-card-secondary">التفاصيل</Link>
												<Link
													href={{
														pathname: "/checkout",
														query: { product: item.productName, price: item.price, image },
													}}
													onClick={() => handleBuyClick(item.id)}
													className="stable-card-buy"
												>
													{isBuying ? "جارٍ..." : "شراء الآن"}
													<FiArrowRight />
												</Link>
											</div>
										</div>
									</article>
								);
							})}
						</div>
					)}

					{!loading && !filteredItems.length ? (
						<div className="stable-empty">لا توجد نتائج مطابقة. غيّر البحث أو الفلتر وجرب مرة ثانية.</div>
					) : null}
				</section>

				<section className="stable-info-grid">
					<div>
						<h2>لماذا نحن؟</h2>
						<p>واجهة شراء واضحة وسريعة، منتجات مرتبة، ضمانات ظاهرة، وتجربة دفع مفهومة.</p>
					</div>
					<div>
						<h2>الضمانات</h2>
						<p>كل بطاقة تعرض التسليم والضمان والمخزون قبل الانتقال للدفع.</p>
					</div>
				</section>

				<section className="stable-reviews">
					{reviews.map((review) => (
						<article key={review.name}>
							<div>{Array.from({ length: review.rating }).map((_, index) => <FiStar key={index} />)}</div>
							<p>{review.text}</p>
							<strong>{review.name}</strong>
						</article>
					))}
				</section>

				<section className="stable-faq">
					<h2>الأسئلة الشائعة</h2>
					<div>
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

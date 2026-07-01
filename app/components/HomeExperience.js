"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
	FiArrowRight,
	FiCheckCircle,
	FiClock,
	FiCreditCard,
	FiDownloadCloud,
	FiSearch,
	FiShield,
	FiStar,
	FiTrendingUp,
	FiZap,
} from "react-icons/fi";
import StoreNav from "./StoreNav";

const reviews = [
	{ name: "سارة م.", role: "مصممة UI", text: "اشتريت Adobe و Office من نفس الصفحة، التجربة مرتبة وواضحة.", rating: 5 },
	{ name: "عبدالله ن.", role: "صاحب متجر", text: "الأسعار واضحة والتسليم سريع. الواجهة تعطي ثقة قبل الدفع.", rating: 5 },
	{ name: "ليان ع.", role: "طالبة", text: "أعجبني ملخص الطلب وتفاصيل الضمان قبل الشراء.", rating: 5 },
];

const faqs = [
	["متى يصل المفتاح؟", "تظهر تفاصيل التسليم داخل بطاقة المنتج، وغالبية المنتجات مهيأة للتسليم الفوري أو خلال دقائق."],
	["هل يمكنني مراجعة الطلب قبل الدفع؟", "نعم، صفحة الدفع تعرض ملخصًا واضحًا للسعر والرسوم والبطاقة بشكل مخفي."],
	["هل تعمل المفاتيح على أكثر من جهاز؟", "يعتمد ذلك على نوع المنتج، وتظهر معلومات الضمان والتسليم في بطاقة المنتج وصفحته."],
	["هل يوجد دعم بعد الشراء؟", "تظهر شروط الضمان والدعم داخل كل منتج، ويمكن متابعة حالة البريد من لوحة الإدارة."],
];

const deliverySteps = [
	{ title: "اختر المنتج", text: "قارن السعر والضمان والتسليم من البطاقة مباشرة.", icon: FiSearch },
	{ title: "راجع الطلب", text: "انتقل للدفع مع ملخص واضح للمنتج والسعر.", icon: FiCreditCard },
	{ title: "استلم المفتاح", text: "تظهر حالة التسليم والضمان مع دعم الاستبدال.", icon: FiDownloadCloud },
];

function productSlug(item) {
	return String(item?.id || item?.productName || "").trim();
}

function formatPrice(value) {
	const number = Number(String(value ?? "").replace(/[^\d.]/g, ""));
	return Number.isFinite(number) ? `${number.toFixed(2)}$` : "0.00$";
}

function ProductSkeleton() {
	return (
		<div className="premium-card skeleton-card">
			<div className="skeleton-block aspect-[16/10]" />
			<div className="mt-4 space-y-3">
				<div className="skeleton-line w-2/3" />
				<div className="skeleton-line w-full" />
				<div className="skeleton-line w-1/2" />
			</div>
		</div>
	);
}

export default function HomeExperience() {
	const [items, setItems] = useState([]);
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		let mounted = true;
		fetch("/api/keys", { cache: "no-store" })
			.then((response) => response.json())
			.then((data) => {
				if (mounted) setItems(data?.data ?? []);
			})
			.catch(() => {
				if (mounted) setItems([]);
			})
			.finally(() => {
				if (mounted) setLoading(false);
			});

		return () => {
			mounted = false;
		};
	}, []);

	const stats = useMemo(() => {
		const stock = items.reduce((sum, item) => sum + Number(item.stock || 0), 0);
		const platforms = new Set(items.map((item) => item.platform).filter(Boolean)).size;
		const bestPrice = items.reduce((min, item) => Math.min(min, Number(item.price || min)), 99);
		return {
			products: items.length,
			stock,
			platforms,
			bestPrice: Number.isFinite(bestPrice) ? bestPrice : 0,
		};
	}, [items]);

	const featured = [...items]
		.sort((a, b) => Number(b.stock || 0) - Number(a.stock || 0))
		.slice(0, 6);
	const heroProduct = featured[0] || items[0] || null;
	const dealProducts = featured.slice(0, 3);

	return (
		<main className="premium-shell min-h-screen text-slate-900" dir="rtl">
			<StoreNav />
			<section className="premium-hero welcome-hero mx-auto grid w-full max-w-[1200px] gap-6 px-4 py-8 md:px-6 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
				<div className="hero-copy">
					<div className="premium-eyebrow">
						<FiZap />
						متجر مفاتيح رقمية موثوق
					</div>
					<h1 className="welcome-title dark-aware-text">
						فعّل برامجك وألعابك خلال دقائق بتجربة شراء واضحة وآمنة
					</h1>
					<p className="welcome-subtitle dark-aware-muted">
						مفاتيح Windows و Office و Adobe وبطاقات الألعاب في واجهة عربية هادئة، مع سعر واضح وضمان ظاهر قبل الانتقال للدفع.
					</p>
					<div className="welcome-trust-row">
						<span><FiCheckCircle /> تفعيل فوري</span>
						<span><FiShield /> ضمان استبدال</span>
						<span><FiClock /> تسليم سريع</span>
					</div>
					<div className="welcome-actions">
						<Link
							href={heroProduct ? `/products/${productSlug(heroProduct)}` : "/products"}
							className="primary-action"
						>
							{heroProduct ? "مشاهدة العرض الآن" : "تصفح المنتجات"}
							<FiArrowRight />
						</Link>
						<a href="#recommended" className="secondary-action">
							العروض الموصى بها
						</a>
					</div>
					<div className="live-stats welcome-stats">
						<div><strong>{stats.products}</strong><span>منتج نشط</span></div>
						<div><strong>{stats.stock}</strong><span>مفتاح متاح</span></div>
						<div><strong>{stats.platforms}</strong><span>منصات</span></div>
						<div><strong>{formatPrice(stats.bestPrice)}</strong><span>أقل سعر</span></div>
					</div>
				</div>

				<div className="hero-stage">
					<div className="floating-card hero-product-card">
						<div className="relative aspect-[16/10] overflow-hidden rounded-2xl">
							<Image
								src={heroProduct?.image || "/images/product-art/digital-product.svg"}
								alt={heroProduct?.productName || "متجر مفاتيح رقمي Premium"}
								fill
								priority
								sizes="(max-width: 768px) 90vw, 520px"
								className="object-contain p-4"
							/>
						</div>
						<div className="welcome-card-meta">
							<div>
								<p className="dark-aware-muted">{heroProduct?.platform || "Windows 11 Pro"}</p>
								<h2 className="dark-aware-text">{heroProduct?.productName || "تفعيل فوري مع ضمان"}</h2>
							</div>
							<span>{formatPrice(heroProduct?.price || 14.99)}</span>
						</div>
						<div className="welcome-card-features">
							<span><FiDownloadCloud /> {heroProduct?.delivery || "وصول سريع"}</span>
							<span><FiStar /> تقييم 4.9</span>
						</div>
						<Link
							href={heroProduct ? `/products/${productSlug(heroProduct)}` : "/products"}
							className="welcome-card-cta"
						>
							عرض التفاصيل
							<FiArrowRight />
						</Link>
					</div>
				</div>
			</section>

			<section className="welcome-steps mx-auto grid w-full max-w-[1200px] gap-3 px-4 pb-8 md:grid-cols-3 md:px-6">
				{deliverySteps.map((step) => {
					const Icon = step.icon;
					return (
						<div key={step.title} className="welcome-step-card">
							<span><Icon /></span>
							<div>
								<strong>{step.title}</strong>
								<p>{step.text}</p>
							</div>
						</div>
					);
				})}
			</section>

			<section id="recommended" className="mx-auto w-full max-w-[1200px] px-4 py-8 md:px-6">
				<div className="section-heading">
					<div>
						<p className="premium-eyebrow"><FiTrendingUp /> عروض موصى بها</p>
						<h2 className="mt-3 text-3xl font-bold dark-aware-text">اختيارات سريعة للشراء</h2>
					</div>
					<Link href="/products" className="secondary-action">عرض الكل</Link>
				</div>
				<div className="mt-6 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
					{loading ? [0, 1, 2].map((item) => <ProductSkeleton key={item} />) : dealProducts.map((item) => (
						<Link href={`/products/${productSlug(item)}`} key={item.id} className="premium-card premium-product-card">
							<div className="relative aspect-[16/10] overflow-hidden rounded-2xl bg-slate-100">
								<Image
									src={item.image || "/images/product-art/digital-product.svg"}
									alt={item.productName}
									fill
									sizes="(max-width: 768px) 90vw, (max-width: 1200px) 45vw, 300px"
									loading="lazy"
									className="object-contain p-3"
								/>
								<span className="premium-badge">{item.platform}</span>
							</div>
							<h3 className="mt-4 text-xl font-bold dark-aware-text">{item.productName}</h3>
							<p className="product-desc mt-2 dark-aware-muted">{item.description}</p>
							<div className="mt-4 flex items-center justify-between">
								<strong className="text-2xl font-bold text-[#1475d1]">{formatPrice(item.price)}</strong>
								<span className="inline-flex items-center gap-1 text-sm font-bold text-emerald-700"><FiCheckCircle /> {item.delivery}</span>
							</div>
						</Link>
					))}
				</div>
			</section>

			<section className="mx-auto grid w-full max-w-6xl gap-5 px-4 py-10 lg:grid-cols-3">
				{reviews.map((review) => (
					<article key={review.name} className="premium-card review-card">
						<div className="flex gap-1 text-amber-400">{Array.from({ length: review.rating }).map((_, index) => <FiStar key={index} />)}</div>
						<p className="mt-4 text-sm leading-8 text-slate-600 dark-aware-muted">{review.text}</p>
						<div className="mt-5 font-black dark-aware-text">{review.name}</div>
						<div className="text-xs font-bold text-slate-400">{review.role}</div>
					</article>
				))}
			</section>

			<section id="faq" className="mx-auto w-full max-w-4xl px-4 py-12">
				<p className="premium-eyebrow mx-auto w-fit"><FiSearch /> FAQ</p>
				<h2 className="mt-3 text-center text-3xl font-black dark-aware-text">أسئلة شائعة قبل الشراء</h2>
				<div className="mt-6 space-y-3">
					{faqs.map(([question, answer]) => (
						<details key={question} className="faq-item">
							<summary>{question}</summary>
							<p>{answer}</p>
						</details>
					))}
				</div>
			</section>

			<script
				type="application/ld+json"
				dangerouslySetInnerHTML={{
					__html: JSON.stringify({
						"@context": "https://schema.org",
						"@type": "Store",
						name: "Key Store",
						description: "متجر مفاتيح رقمية للبرامج والألعاب بتجربة عربية Premium.",
						url: "https://key-store-gamma.vercel.app",
					}),
				}}
			/>
		</main>
	);
}

"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
	FiArrowRight,
	FiCheckCircle,
	FiClock,
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

	return (
		<main className="premium-shell min-h-screen text-slate-900" dir="rtl">
			<StoreNav />
			<section className="premium-hero mx-auto grid w-full max-w-6xl gap-8 px-4 pb-12 pt-24 lg:min-h-screen lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
				<div className="hero-copy">
					<div className="premium-eyebrow">
						<FiZap />
						متجر مفاتيح Premium للبرامج والألعاب
					</div>
					<h1 className="mt-5 text-4xl font-black leading-tight text-slate-950 sm:text-5xl lg:text-6xl dark-aware-text">
						تجربة شراء رقمية بمستوى Microsoft و Adobe و Envato
					</h1>
					<p className="mt-5 max-w-2xl text-base leading-8 text-slate-600 sm:text-lg dark-aware-muted">
						منتجات منظمة، بطاقات احترافية، تقييمات حقيقية، ملخص دفع واضح، وثيم Light/Dark مصمم لمتجر SaaS حديث.
					</p>
					<div className="mt-7 flex flex-wrap items-center gap-3">
						<Link href="/products" className="primary-action">
							تصفح المنتجات
							<FiArrowRight />
						</Link>
						<a href="#faq" className="secondary-action">
							الأسئلة الشائعة
						</a>
					</div>
					<div className="live-stats mt-8">
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
								src="/images/real/laptop.jpg"
								alt="متجر مفاتيح رقمي Premium"
								fill
								priority
								sizes="(max-width: 1024px) 100vw, 520px"
								className="object-cover"
							/>
						</div>
						<div className="mt-4 flex items-center justify-between gap-4">
							<div>
								<p className="text-sm font-bold text-slate-500 dark-aware-muted">Windows 11 Pro</p>
								<h2 className="text-2xl font-black dark-aware-text">تفعيل فوري</h2>
							</div>
							<span className="rounded-full bg-emerald-50 px-3 py-1 text-sm font-black text-emerald-700">14.99$</span>
						</div>
					</div>
					<div className="hero-orbit orbit-one"><FiShield /></div>
					<div className="hero-orbit orbit-two"><FiDownloadCloud /></div>
					<div className="hero-orbit orbit-three"><FiClock /></div>
				</div>
			</section>

			<section className="mx-auto w-full max-w-6xl px-4 py-10">
				<div className="section-heading">
					<div>
						<p className="premium-eyebrow"><FiTrendingUp /> الأكثر طلبًا</p>
						<h2 className="mt-3 text-3xl font-black dark-aware-text">بطاقات منتجات Premium</h2>
					</div>
					<Link href="/products" className="secondary-action">عرض الكل</Link>
				</div>
				<div className="mt-6 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
					{loading ? [0, 1, 2].map((item) => <ProductSkeleton key={item} />) : featured.map((item, index) => (
						<Link href={`/products/${productSlug(item)}`} key={item.id} className="premium-card premium-product-card">
							<div className="relative aspect-[16/10] overflow-hidden rounded-2xl bg-slate-100">
								<Image
									src={item.image || "/images/real/dev-setup.jpg"}
									alt={item.productName}
									fill
									sizes="(max-width: 768px) 100vw, 33vw"
									priority={index === 0}
									className="object-contain p-3"
								/>
								<span className="premium-badge">{item.platform}</span>
							</div>
							<h3 className="mt-4 text-xl font-black dark-aware-text">{item.productName}</h3>
							<p className="product-desc mt-2 dark-aware-muted">{item.description}</p>
							<div className="mt-4 flex items-center justify-between">
								<strong className="text-2xl font-black text-[#1475d1]">{formatPrice(item.price)}</strong>
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

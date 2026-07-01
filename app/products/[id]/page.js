"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
	FiArrowRight,
	FiCheckCircle,
	FiClock,
	FiCreditCard,
	FiKey,
	FiShield,
	FiStar,
} from "react-icons/fi";
import StoreNav from "../../components/StoreNav";

function formatPrice(value) {
	const number = Number(String(value ?? "").replace(/[^\d.]/g, ""));
	return Number.isFinite(number) ? `${number.toFixed(2)}$` : "0.00$";
}

function normalize(value) {
	return decodeURIComponent(String(value || "")).trim().toLowerCase();
}

export default function ProductDetailsPage() {
	const params = useParams();
	const [items, setItems] = useState([]);
	const [loading, setLoading] = useState(true);
	const productKey = normalize(params?.id);

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

	const product = useMemo(() => {
		return items.find((item) => {
			return normalize(item.id) === productKey || normalize(item.productName) === productKey;
		});
	}, [items, productKey]);

	const related = items
		.filter((item) => product && item.id !== product.id && item.platform === product.platform)
		.slice(0, 3);

	if (loading) {
		return (
			<main className="premium-shell min-h-screen px-4 pb-12 pt-24" dir="rtl">
				<StoreNav />
				<div className="mx-auto grid max-w-6xl gap-6 lg:grid-cols-[0.95fr_1.05fr]">
					<div className="premium-card skeleton-card min-h-[420px]" />
					<div className="premium-card skeleton-card min-h-[420px]" />
				</div>
			</main>
		);
	}

	if (!product) {
		return (
			<main className="premium-shell min-h-screen px-4 pb-12 pt-24" dir="rtl">
				<StoreNav />
				<section className="soft-panel mx-auto max-w-3xl p-8 text-center">
					<FiKey className="mx-auto text-4xl text-[#1475d1]" />
					<h1 className="mt-4 text-3xl font-black dark-aware-text">المنتج غير موجود</h1>
					<p className="mt-3 text-slate-500 dark-aware-muted">ربما تم تغيير المنتج أو حذفه من لوحة الإدارة.</p>
					<Link href="/products" className="primary-action mt-6">
						العودة للمنتجات
						<FiArrowRight />
					</Link>
				</section>
			</main>
		);
	}

	const image = product.image || "/images/product-art/digital-product.svg";

	return (
		<main className="premium-shell min-h-screen px-4 pb-16 pt-24 text-slate-900" dir="rtl">
			<StoreNav />
			<section className="mx-auto grid w-full max-w-6xl gap-6 lg:grid-cols-[0.95fr_1.05fr] lg:items-start">
				<div className="premium-card product-detail-media">
					<div className="relative aspect-[4/3] overflow-hidden rounded-3xl bg-slate-100">
						<Image
							src={image}
							alt={product.productName}
							fill
							priority
							sizes="(max-width: 768px) 90vw, 520px"
							className="object-contain p-5"
						/>
					</div>
					<div className="mt-4 grid gap-3 sm:grid-cols-3">
						<div className="mini-feature"><FiClock /> {product.delivery}</div>
						<div className="mini-feature"><FiShield /> {product.guarantee}</div>
						<div className="mini-feature"><FiKey /> مخزون {product.stock}</div>
					</div>
				</div>

				<div className="premium-card p-6 md:p-8">
					<div className="premium-eyebrow w-fit"><FiCheckCircle /> {product.platform}</div>
					<h1 className="mt-4 text-4xl font-black leading-tight dark-aware-text">{product.productName}</h1>
					<p className="mt-4 text-base leading-8 text-slate-600 dark-aware-muted">{product.description}</p>

					<div className="mt-6 flex flex-wrap items-center gap-3">
						<div className="rounded-2xl bg-blue-50 px-5 py-3 text-3xl font-black text-[#1475d1]">{formatPrice(product.price)}</div>
						<div className="flex items-center gap-1 text-amber-400">
							{[0, 1, 2, 3, 4].map((item) => <FiStar key={item} />)}
							<span className="mr-2 text-sm font-bold text-slate-500 dark-aware-muted">4.9 من 5</span>
						</div>
					</div>

					<div className="mt-7 grid gap-3 sm:grid-cols-2">
						<Link
							href={{
								pathname: "/checkout",
								query: {
									product: product.productName,
									price: product.price,
									image,
								},
							}}
							className="primary-action"
						>
							شراء الآن
							<FiCreditCard />
						</Link>
						<Link href="/products" className="secondary-action">
							تصفح المزيد
							<FiArrowRight />
						</Link>
					</div>

					<div className="mt-8 space-y-3">
						<details className="faq-item" open>
							<summary>ماذا يشمل هذا المنتج؟</summary>
							<p>{product.description} مع تفاصيل التسليم والضمان الموضحة في هذه الصفحة.</p>
						</details>
						<details className="faq-item">
							<summary>متى يتم التسليم؟</summary>
							<p>{product.delivery}، ويتم إرسال معلومات الطلب عبر البريد بعد تأكيده.</p>
						</details>
						<details className="faq-item">
							<summary>ما الضمان؟</summary>
							<p>{product.guarantee}.</p>
						</details>
					</div>
				</div>
			</section>

			{related.length ? (
				<section className="mx-auto mt-10 w-full max-w-6xl">
					<h2 className="text-2xl font-black dark-aware-text">منتجات مشابهة</h2>
					<div className="mt-5 grid gap-5 md:grid-cols-3">
						{related.map((item) => (
							<Link href={`/products/${item.id}`} key={item.id} className="premium-card premium-product-card">
								<div className="relative aspect-[16/10] overflow-hidden rounded-2xl bg-slate-100">
									<Image
										src={item.image || "/images/product-art/digital-product.svg"}
										alt={item.productName}
										fill
										loading="lazy"
										sizes="(max-width: 768px) 90vw, (max-width: 1200px) 45vw, 300px"
										className="object-contain p-3"
									/>
								</div>
								<h3 className="mt-4 font-black dark-aware-text">{item.productName}</h3>
								<div className="mt-2 font-black text-[#1475d1]">{formatPrice(item.price)}</div>
							</Link>
						))}
					</div>
				</section>
			) : null}

			<script
				type="application/ld+json"
				dangerouslySetInnerHTML={{
					__html: JSON.stringify({
						"@context": "https://schema.org",
						"@type": "Product",
						name: product.productName,
						description: product.description,
						image,
						brand: product.platform,
						offers: {
							"@type": "Offer",
							price: Number(product.price || 0),
							priceCurrency: "USD",
							availability: Number(product.stock || 0) > 0 ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
						},
						aggregateRating: {
							"@type": "AggregateRating",
							ratingValue: "4.9",
							reviewCount: "128",
						},
					}),
				}}
			/>
		</main>
	);
}

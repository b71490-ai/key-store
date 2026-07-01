import { NextResponse } from "next/server";
import { existsSync } from "node:fs";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const MAX_ALLOWED_PRICE = 10;

const canonicalPriceByProductName = {
	"Windows 11 Pro Key": 9.99,
	"Office 2021 Professional": 9.75,
	"Adobe Creative Cloud 1 Year": 9.95,
	"Windows 10 Pro Key": 8.99,
	"Windows 11 Home Key": 7.99,
	"Office 365 Family 1 Year": 9.5,
	"Office 2021 Home & Student": 7.75,
	"Microsoft Visio Professional": 8.5,
	"Adobe Photoshop 1 Year": 8.99,
	"Adobe Premiere Pro 1 Year": 9.25,
	"Adobe Illustrator 1 Year": 8.75,
	"Steam Wallet 50 USD": 9.99,
	"Steam Wallet 20 USD": 6.99,
	"Xbox Game Pass Ultimate 3 Months": 8.99,
	"Windows Server 2022 Standard": 9.85,
	"Project Professional 2021": 8.75,
	"Canva Pro 1 Year": 5.99,
	"EA Play 12 Months": 6.49,
	"Windows 11 Pro Workstation Key": 9.45,
	"Office 2019 Professional Plus": 7.99,
	"Microsoft 365 Personal 6 Months": 6.99,
	"Windows 10 Home Key": 7.49,
	"Adobe Lightroom 1 Year": 8.25,
	"Adobe After Effects Starter": 9.35,
	"Steam Wallet 10 USD": 4.99,
	"Xbox Game Pass PC 1 Month": 5.99,
	"Canva Pro 3 Months": 4.99,
	"Norton Security 1 Year": 8.99,
	"ESET Internet Security 1 Year": 9.25,
	"Bitdefender Total Security 1 Year": 9.75,
	"Grammarly Premium 3 Months": 6.49,
	"Notion Plus 6 Months": 6.99,
};

const fallbackPricePalette = [
	4.99,
	5.49,
	5.99,
	6.49,
	6.99,
	7.5,
	7.99,
	8.99,
	9.49,
	9.99,
];

const productImageByPlatform = {
	Windows: [
		"/images/product-art/windows-11-pro-key.svg",
		"/images/product-art/windows-10-pro-key.svg",
		"/images/product-art/windows-11-home-key.svg",
		"/images/product-art/windows-server-2022-standard.svg",
	],
	Microsoft: [
		"/images/product-art/office-2021-professional.svg",
		"/images/product-art/office-365-family-1-year.svg",
		"/images/product-art/xbox-game-pass-ultimate-3-months.svg",
		"/images/product-art/project-professional-2021.svg",
	],
	Adobe: [
		"/images/product-art/adobe-creative-cloud-1-year.svg",
		"/images/product-art/adobe-photoshop-1-year.svg",
		"/images/product-art/adobe-premiere-pro-1-year.svg",
		"/images/product-art/adobe-illustrator-1-year.svg",
		"/images/product-art/canva-pro-1-year.svg",
	],
	Steam: [
		"/images/product-art/steam-wallet-20-usd.svg",
		"/images/product-art/steam-wallet-50-usd.svg",
		"/images/product-art/ea-play-12-months.svg",
	],
	General: [
		"/images/product-art/digital-product.svg",
		"/images/product-art/norton-security-1-year.svg",
		"/images/product-art/eset-internet-security-1-year.svg",
		"/images/product-art/bitdefender-total-security-1-year.svg",
		"/images/product-art/grammarly-premium-3-months.svg",
		"/images/product-art/notion-plus-6-months.svg",
	],
};

function resolveProductImage(platform, seed) {
	const collection =
		productImageByPlatform[platform] ?? productImageByPlatform.General;

	return collection[Math.abs(seed) % collection.length];
}

function productArtSlug(value) {
	return String(value || "")
		.toLowerCase()
		.replace(/&/g, "and")
		.replace(/[^a-z0-9]+/g, "-")
		.replace(/^-+|-+$/g, "");
}

function resolveImageByProductName(productName) {
	if (!productName) return undefined;

	const slug = productArtSlug(productName);
	return slug ? `/images/product-art/${slug}.svg` : undefined;
}

function isExistingPublicAsset(filePath = "") {
	if (!filePath || !filePath.startsWith("/")) return false;
	const absolutePath = path.join(process.cwd(), "public", filePath.slice(1));
	return existsSync(absolutePath);
}

function resolveSafeImage({ productName, platform, seed, preferredImage }) {

	// If a preferred image is explicitly provided (uploaded or inline), prefer it.
	if (preferredImage) {
		try {
			const asStr = String(preferredImage);
			if (asStr.startsWith("data:")) return asStr; // inline data URI
		} catch {
			// ignore and continue
		}

		if (isExistingPublicAsset(preferredImage)) {
			return preferredImage;
		}
	}

	const byName = resolveImageByProductName(productName);
	if (byName && isExistingPublicAsset(byName)) {
		return byName;
	}

	const byPlatform = resolveProductImage(platform, seed);
	if (byPlatform && isExistingPublicAsset(byPlatform)) {
		return byPlatform;
	}

	return "/images/product-art/digital-product.svg";
}

function getCanonicalPrice(productName, seed = 0) {
	const exact = canonicalPriceByProductName[productName];
	if (typeof exact === "number") return Math.min(exact, MAX_ALLOWED_PRICE);

	return Math.min(
		fallbackPricePalette[Math.abs(seed) % fallbackPricePalette.length],
		MAX_ALLOWED_PRICE
	);
}

function normalizeProductPrice(item, indexSeed = 0) {
	const fallback = getCanonicalPrice(item?.productName, indexSeed);
	const parsed = Number(item?.price);

	if (Number.isNaN(parsed) || parsed <= 0 || parsed > MAX_ALLOWED_PRICE) {
		return fallback;
	}

	return Number(parsed.toFixed(2));
}

function normalizeAdPriority(value, indexSeed = 0) {
	const parsed = Number(value);
	if (Number.isNaN(parsed) || parsed < 1) {
		return indexSeed + 1;
	}

	return Math.min(Math.floor(parsed), 999);
}

function normalizeIsAdEnabled(value, indexSeed = 0) {
	if (typeof value === "boolean") return value;
	if (typeof value === "string") {
		const lowered = value.toLowerCase();
		if (lowered === "true" || lowered === "1") return true;
		if (lowered === "false" || lowered === "0") return false;
	}

	// Preserve old behavior for existing stores by enabling the first 4 by default.
	return indexSeed < 4;
}

const defaultKeysStore = [
	{
		id: 1,
		productName: "Windows 11 Pro Key",
		platform: "Windows",
		price: 29,
		stock: 42,
		delivery: "تسليم فوري",
		guarantee: "ضمان استبدال لمدة 30 يوم",
		description: "مفتاح رقمي أصلي لتفعيل ويندوز 11 برو على جهاز واحد.",
	},
	{
		id: 2,
		productName: "Office 2021 Professional",
		platform: "Microsoft",
		price: 34,
		stock: 18,
		delivery: "خلال 5 دقائق",
		guarantee: "دعم فني بعد الشراء",
		description: "حزمة أوفيس كاملة للمستخدمين الذين يحتاجون Word و Excel و PowerPoint.",
	},
	{
		id: 3,
		productName: "Adobe Creative Cloud 1 Year",
		platform: "Adobe",
		price: 89,
		stock: 9,
		delivery: "تفعيل بالبريد الإلكتروني",
		guarantee: "حساب موثوق لمدة سنة",
		description: "اشتراك سنوي مخصص للمصممين وصناع المحتوى مع وصول كامل لتطبيقات Adobe.",
	},
	{
		id: 4,
		productName: "Windows 10 Pro Key",
		platform: "Windows",
		price: 19,
		stock: 64,
		delivery: "تسليم فوري",
		guarantee: "ضمان 30 يوم",
		description: "مفتاح رقمي لتفعيل ويندوز 10 برو للأجهزة المكتبية والمحمولة.",
	},
	{
		id: 5,
		productName: "Windows 11 Home Key",
		platform: "Windows",
		price: 13.99,
		stock: 120,
		delivery: "خلال دقيقتين",
		guarantee: "ضمان تفعيل",
		description: "نسخة منزلية مثالية للاستخدام اليومي مع تحديثات رسمية.",
	},
	{
		id: 6,
		productName: "Office 365 Family 1 Year",
		platform: "Microsoft",
		price: 44,
		stock: 37,
		delivery: "بريد إلكتروني",
		guarantee: "ضمان سنة كاملة",
		description: "اشتراك عائلي يدعم عدة مستخدمين مع OneDrive وتطبيقات Office.",
	},
	{
		id: 7,
		productName: "Office 2021 Home & Student",
		platform: "Microsoft",
		price: 27,
		stock: 58,
		delivery: "تسليم فوري",
		guarantee: "دعم فني 90 يوم",
		description: "Word و Excel و PowerPoint بترخيص دائم للاستخدام الدراسي.",
	},
	{
		id: 8,
		productName: "Microsoft Visio Professional",
		platform: "Microsoft",
		price: 32,
		stock: 22,
		delivery: "خلال 5 دقائق",
		guarantee: "ضمان استبدال",
		description: "أداة احترافية لإنشاء المخططات الهندسية والتنظيمية.",
	},
	{
		id: 9,
		productName: "Adobe Photoshop 1 Year",
		platform: "Adobe",
		price: 36,
		stock: 19,
		delivery: "بريد إلكتروني",
		guarantee: "حساب موثوق",
		description: "اشتراك فوتوشوب سنوي للمصممين وصناع المحتوى.",
	},
	{
		id: 10,
		productName: "Adobe Premiere Pro 1 Year",
		platform: "Adobe",
		price: 42,
		stock: 13,
		delivery: "تفعيل بالحساب",
		guarantee: "ضمان 12 شهر",
		description: "تحرير فيديو احترافي مع تحديثات مستمرة طوال السنة.",
	},
	{
		id: 11,
		productName: "Adobe Illustrator 1 Year",
		platform: "Adobe",
		price: 34,
		stock: 16,
		delivery: "خلال 10 دقائق",
		guarantee: "دعم مباشر",
		description: "برنامج تصميم المتجهات للشعارات والهوية البصرية.",
	},
	{
		id: 12,
		productName: "Steam Wallet 50 USD",
		platform: "Steam",
		price: 46,
		stock: 71,
		delivery: "تسليم فوري",
		guarantee: "كود صالح 100%",
		description: "رصيد ستيم لشحن الحساب وشراء الألعاب مباشرة.",
	},
	{
		id: 13,
		productName: "Steam Wallet 20 USD",
		platform: "Steam",
		price: 18.5,
		stock: 96,
		delivery: "خلال دقيقة",
		guarantee: "استبدال عند المشكلة",
		description: "بطاقة شحن ستيم بقيمة 20 دولار لألعابك المفضلة.",
	},
	{
		id: 14,
		productName: "Xbox Game Pass Ultimate 3 Months",
		platform: "Microsoft",
		price: 22,
		stock: 28,
		delivery: "تسليم فوري",
		guarantee: "ضمان تفعيل",
		description: "اشتراك 3 أشهر للوصول إلى مكتبة ألعاب ضخمة على Xbox وPC.",
	},
	{
		id: 15,
		productName: "Windows Server 2022 Standard",
		platform: "Windows",
		price: 79,
		stock: 11,
		delivery: "خلال 15 دقيقة",
		guarantee: "دعم إعداد أولي",
		description: "مفتاح سيرفر رسمي مناسب لبيئات العمل والبنية التحتية.",
	},
	{
		id: 16,
		productName: "Project Professional 2021",
		platform: "Microsoft",
		price: 31,
		stock: 20,
		delivery: "بريد إلكتروني",
		guarantee: "ضمان 30 يوم",
		description: "إدارة المشاريع المتقدمة للشركات والفرق الاحترافية.",
	},
	{
		id: 17,
		productName: "Canva Pro 1 Year",
		platform: "Adobe",
		price: 17,
		stock: 45,
		delivery: "تفعيل بالحساب",
		guarantee: "حساب ثابت",
		description: "اشتراك Canva Pro لتصميم سريع للمحتوى التسويقي والاجتماعي.",
	},
	{
		id: 18,
		productName: "EA Play 12 Months",
		platform: "Steam",
		price: 24,
		stock: 26,
		delivery: "خلال 5 دقائق",
		guarantee: "ضمان اشتراك",
		description: "الوصول إلى مكتبة EA والألعاب الجديدة مع مزايا إضافية.",
	},
].map((item) => ({
	...item,
	price: normalizeProductPrice(item, item.id),
	isAdEnabled: normalizeIsAdEnabled(item.isAdEnabled, item.id - 1),
	adPriority: normalizeAdPriority(item.adPriority, item.id - 1),
	image: resolveSafeImage({
		productName: item.productName,
		platform: item.platform,
		seed: item.id,
	}),
	updatedAt: Date.now(),
}));

const keysStoreFilePath = path.join(process.cwd(), "data", "keys-store.json");
let keysStoreCache = null;

async function saveKeysStore(store) {
	await mkdir(path.dirname(keysStoreFilePath), { recursive: true });
	await writeFile(keysStoreFilePath, JSON.stringify(store, null, 2), "utf8");
}

async function getKeysStore() {
	if (keysStoreCache) return keysStoreCache;

	try {
		const raw = await readFile(keysStoreFilePath, "utf8");
		const parsed = JSON.parse(raw);
		if (Array.isArray(parsed)) {
				keysStoreCache = parsed.map((item, index) => ({
					...item,
					price: normalizeProductPrice(item, index),
					isAdEnabled: normalizeIsAdEnabled(item.isAdEnabled, index),
					adPriority: normalizeAdPriority(item.adPriority, index),
					updatedAt: item.updatedAt ?? Date.now(),
				}));

			try {
				await saveKeysStore(keysStoreCache);
			} catch {
				// Keep runtime data even if normalized write fails.
			}

			return keysStoreCache;
		}
	} catch {
		// Fall back to bundled defaults on first run or invalid file.
	}

	keysStoreCache = JSON.parse(JSON.stringify(defaultKeysStore));

	try {
		await saveKeysStore(keysStoreCache);
	} catch {
		// Ignore filesystem write failures and keep in-memory fallback.
	}

	return keysStoreCache;
}

export async function GET() {
	const keysStore = await getKeysStore();
	return NextResponse.json({ success: true, count: keysStore.length, data: keysStore });
}

export async function POST(request) {
	const keysStore = await getKeysStore();
	const body = await request.json();
	const numericPrice = Number(body?.price);
	const numericStock = Number(body?.stock ?? 0);

	if (!body?.productName || Number.isNaN(numericPrice) || numericPrice <= 0) {
		return NextResponse.json(
			{ success: false, message: "اسم المنتج وسعر صالح مطلوبان." },
			{ status: 400 }
		);
	}

	if (numericPrice > MAX_ALLOWED_PRICE) {
		return NextResponse.json(
			{ success: false, message: `السعر يجب ألا يتجاوز ${MAX_ALLOWED_PRICE} دولار.` },
			{ status: 400 }
		);
	}

	const newProduct = {
		id: Date.now(),
		productName: body.productName,
		platform: body.platform ?? "General",
		price: normalizeProductPrice(
			{ productName: body.productName, price: numericPrice },
			Date.now()
		),
		stock: Number.isNaN(numericStock) || numericStock < 0 ? 0 : numericStock,
		delivery: body.delivery ?? "تسليم فوري",
		guarantee: body.guarantee ?? "ضمان استبدال لمدة 7 أيام",
		description: body.description ?? "منتج جديد تمت إضافته من لوحة الإدارة.",
		isAdEnabled: normalizeIsAdEnabled(body?.isAdEnabled, keysStore.length),
		adPriority: normalizeAdPriority(body?.adPriority, keysStore.length),
		image: resolveSafeImage({
			productName: body.productName,
			platform: body.platform ?? "General",
			seed: Date.now(),
			preferredImage: body.image,
		}),
		updatedAt: Date.now(),
	};

	keysStore.unshift(newProduct);

	let persisted = true;
	try {
		await saveKeysStore(keysStore);
	} catch {
		persisted = false;
	}

	return NextResponse.json(
		{
			success: true,
			message: "تم استلام المنتج الجديد بنجاح.",
			persisted,
			data: newProduct,
		},
		{ status: 201 }
	);
}

export async function PUT(request) {
	const keysStore = await getKeysStore();
	const { searchParams } = new URL(request.url);
	const idParam = searchParams.get("id");
	const targetId = Number(idParam);

	if (!idParam || Number.isNaN(targetId)) {
		return NextResponse.json(
			{ success: false, message: "معرّف المنتج غير صالح." },
			{ status: 400 }
		);
	}

	const body = await request.json();
	const productIndex = keysStore.findIndex((item) => item.id === targetId);

	if (productIndex === -1) {
		return NextResponse.json(
			{ success: false, message: "المنتج غير موجود." },
			{ status: 404 }
		);
	}

	const current = keysStore[productIndex];
	const parsedPrice = body?.price !== undefined ? Number(body.price) : current.price;
	const parsedStock = body?.stock !== undefined ? Number(body.stock) : current.stock;

	if (!body?.productName && !current.productName) {
		return NextResponse.json(
			{ success: false, message: "اسم المنتج مطلوب." },
			{ status: 400 }
		);
	}

	if (Number.isNaN(parsedPrice) || parsedPrice <= 0) {
		return NextResponse.json(
			{ success: false, message: "السعر غير صالح." },
			{ status: 400 }
		);
	}

	if (parsedPrice > MAX_ALLOWED_PRICE) {
		return NextResponse.json(
			{ success: false, message: `السعر يجب ألا يتجاوز ${MAX_ALLOWED_PRICE} دولار.` },
			{ status: 400 }
		);
	}

	const updatedProduct = {
		...current,
		productName: body?.productName ?? current.productName,
		platform: body?.platform ?? current.platform,
		price: normalizeProductPrice(
			{ productName: body?.productName ?? current.productName, price: parsedPrice },
			current.id
		),
		stock: Number.isNaN(parsedStock) || parsedStock < 0 ? 0 : parsedStock,
		delivery: body?.delivery ?? current.delivery,
		guarantee: body?.guarantee ?? current.guarantee,
		description: body?.description ?? current.description,
		isAdEnabled: body?.isAdEnabled !== undefined
			? normalizeIsAdEnabled(body.isAdEnabled, productIndex)
			: normalizeIsAdEnabled(current.isAdEnabled, productIndex),
		adPriority: body?.adPriority !== undefined
			? normalizeAdPriority(body.adPriority, productIndex)
			: normalizeAdPriority(current.adPriority, productIndex),
		image: resolveSafeImage({
			productName: body?.productName ?? current.productName,
			platform: body?.platform ?? current.platform,
			seed: current.id,
			preferredImage: body?.image ?? current.image,
		}),
		updatedAt: Date.now(),
	};

	keysStore[productIndex] = updatedProduct;

	let persisted = true;
	try {
		await saveKeysStore(keysStore);
	} catch {
		persisted = false;
	}

	return NextResponse.json({
		success: true,
		message: "تم تحديث المنتج بنجاح.",
		persisted,
		data: updatedProduct,
	});
}

export async function DELETE(request) {
	const keysStore = await getKeysStore();
	const { searchParams } = new URL(request.url);
	const idParam = searchParams.get("id");
	const targetId = Number(idParam);

	if (!idParam || Number.isNaN(targetId)) {
		return NextResponse.json(
			{ success: false, message: "معرّف المنتج غير صالح." },
			{ status: 400 }
		);
	}

	const productIndex = keysStore.findIndex((item) => item.id === targetId);

	if (productIndex === -1) {
		return NextResponse.json(
			{ success: false, message: "المنتج غير موجود." },
			{ status: 404 }
		);
	}

	const [deletedProduct] = keysStore.splice(productIndex, 1);

	let persisted = true;
	try {
		await saveKeysStore(keysStore);
	} catch {
		persisted = false;
	}

	return NextResponse.json({
		success: true,
		message: "تم حذف المنتج بنجاح.",
		persisted,
		data: deletedProduct,
	});
}

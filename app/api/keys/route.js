import { NextResponse } from "next/server";

const productImageByPlatform = {
	Windows: [
		"/images/real/laptop.jpg",
		"/images/real/dev-setup.jpg",
	],
	Microsoft: [
		"/images/product-office.jpg",
		"/images/real/code-screen.jpg",
	],
	Adobe: [
		"/images/real/chip.jpg",
		"/images/real/dev-setup.jpg",
	],
	Steam: [
		"/images/real/code-screen.jpg",
		"/images/real/laptop.jpg",
	],
	General: ["/images/real/dev-setup.jpg"],
};

const productImageByName = {
	"Windows 11 Pro Key": "/uploads/products/1776453299953-cfa36b44-803b-4005-9b52-8e6eb6153263.avif",
	"Office 2021 Professional": "/uploads/products/1776453511014-23b8bcc7-d621-456c-94fb-864288b5c4c6.jpg",
	"Adobe Creative Cloud 1 Year": "/uploads/products/1776453632023-f8fe9758-7a76-4263-8c3c-8a8d317d6278.jpg",
	"Windows 10 Pro Key": "/uploads/products/1776453771646-eb8dc436-5e39-4565-a8bf-a145c7730525.jpg",
	"Windows 11 Home Key": "/uploads/products/1776453951187-179d2ece-32d9-4004-8c3d-8f9ceb085b37.jpg",
	"Office 365 Family 1 Year": "/uploads/products/1776454118715-f6d54cd0-a345-47b2-8459-57fe1558e254.jpg",
	"Office 2021 Home & Student": "/uploads/products/1776454390486-88d6d493-d163-4806-a55c-1ef8ac5ce15e.jpg",
	"Microsoft Visio Professional": "/uploads/products/1776454541323-e7754877-59e5-428d-8ac0-4dfdb0ad8023.webp",
	"Adobe Photoshop 1 Year": "/uploads/products/1776454711247-9634ac00-f6de-4181-8789-dd000da3d2c6.webp",
	"Adobe Premiere Pro 1 Year": "/uploads/products/1776454810122-241bfdb0-0192-4586-8852-8344fafad0bc.webp",
	"Adobe Illustrator 1 Year": "/uploads/products/1776454950695-4be8ac27-5196-485a-8bcc-3ab427802135.jpg",
	"Steam Wallet 50 USD": "/uploads/products/1776455189240-c2feb073-3358-4b58-b7b0-70f224375bb9.jpg",
	"Steam Wallet 20 USD": "/uploads/products/1776455189240-c2feb073-3358-4b58-b7b0-70f224375bb9.jpg",
	"Xbox Game Pass Ultimate 3 Months": "/uploads/products/1776455375739-f8bdb87e-6d10-4c60-a065-d58d19c6793e.jpg",
	"Windows Server 2022 Standard": "/uploads/products/1776455494276-62406757-b171-419b-9c8b-ee6b70c194c3.png",
	"Project Professional 2021": "/uploads/products/1776455641506-86686594-344f-4fd5-bd88-5fb2aec395e6.webp",
	"Canva Pro 1 Year": "/uploads/products/1776455890029-1b1390b8-a01b-4cca-b483-3854f4118762.webp",
	"EA Play 12 Months": "/uploads/products/1776455780808-f600a4ca-5c81-4254-a33c-96cea5ce65ef.avif",
};

function resolveProductImage(platform, seed) {
	const collection =
		productImageByPlatform[platform] ?? productImageByPlatform.General;

	return collection[Math.abs(seed) % collection.length];
}

function resolveImageByProductName(productName) {
	if (!productName) return undefined;

	const exact = productImageByName[productName];
	if (exact) return exact;

	const foundEntry = Object.entries(productImageByName).find(([name]) =>
		name.toLowerCase() === String(productName).toLowerCase()
	);

	return foundEntry?.[1];
}

const keysStore = [
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
	image:
		resolveImageByProductName(item.productName) ??
		resolveProductImage(item.platform, item.id),
}));

export async function GET() {
	return NextResponse.json({ success: true, count: keysStore.length, data: keysStore });
}

export async function POST(request) {
	const body = await request.json();
	const numericPrice = Number(body?.price);
	const numericStock = Number(body?.stock ?? 0);

	if (!body?.productName || Number.isNaN(numericPrice) || numericPrice <= 0) {
		return NextResponse.json(
			{ success: false, message: "اسم المنتج وسعر صالح مطلوبان." },
			{ status: 400 }
		);
	}

	const newProduct = {
		id: Date.now(),
		productName: body.productName,
		platform: body.platform ?? "General",
		price: numericPrice,
		stock: Number.isNaN(numericStock) || numericStock < 0 ? 0 : numericStock,
		delivery: body.delivery ?? "تسليم فوري",
		guarantee: body.guarantee ?? "ضمان استبدال لمدة 7 أيام",
		description: body.description ?? "منتج جديد تمت إضافته من لوحة الإدارة.",
		image:
			body.image ??
			resolveImageByProductName(body.productName) ??
			resolveProductImage(body.platform ?? "General", Date.now()),
	};

	keysStore.unshift(newProduct);

	return NextResponse.json(
		{
			success: true,
			message: "تم استلام المنتج الجديد بنجاح.",
			data: newProduct,
		},
		{ status: 201 }
	);
}

export async function PUT(request) {
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

	const updatedProduct = {
		...current,
		productName: body?.productName ?? current.productName,
		platform: body?.platform ?? current.platform,
		price: parsedPrice,
		stock: Number.isNaN(parsedStock) || parsedStock < 0 ? 0 : parsedStock,
		delivery: body?.delivery ?? current.delivery,
		guarantee: body?.guarantee ?? current.guarantee,
		description: body?.description ?? current.description,
		image:
			body?.image ??
			resolveImageByProductName(body?.productName ?? current.productName) ??
			current.image ??
			resolveProductImage(body?.platform ?? current.platform, current.id),
	};

	keysStore[productIndex] = updatedProduct;

	return NextResponse.json({
		success: true,
		message: "تم تحديث المنتج بنجاح.",
		data: updatedProduct,
	});
}

export async function DELETE(request) {
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

	return NextResponse.json({
		success: true,
		message: "تم حذف المنتج بنجاح.",
		data: deletedProduct,
	});
}

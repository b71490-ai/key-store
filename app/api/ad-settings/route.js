import { NextResponse } from "next/server";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const adSettingsFilePath = path.join(process.cwd(), "data", "ads-settings.json");

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

let adSettingsCache = null;

function normalizeAdSettings(input = {}) {
	const autoRotateMs = Number(input.autoRotateMs);
	const maxAds = Number(input.maxAds);

	return {
		sectionTitle: String(input.sectionTitle || defaultAdSettings.sectionTitle).trim() || defaultAdSettings.sectionTitle,
		badgeText: String(input.badgeText || defaultAdSettings.badgeText).trim() || defaultAdSettings.badgeText,
		autoRotateEnabled: Boolean(input.autoRotateEnabled),
		autoRotateMs: Number.isFinite(autoRotateMs) ? Math.min(Math.max(Math.floor(autoRotateMs), 1500), 15000) : defaultAdSettings.autoRotateMs,
		pauseOnHover: input.pauseOnHover === undefined ? defaultAdSettings.pauseOnHover : Boolean(input.pauseOnHover),
		maxAds: Number.isFinite(maxAds) ? Math.min(Math.max(Math.floor(maxAds), 1), 12) : defaultAdSettings.maxAds,
		showProgress: input.showProgress === undefined ? defaultAdSettings.showProgress : Boolean(input.showProgress),
		showThumbnails: input.showThumbnails === undefined ? defaultAdSettings.showThumbnails : Boolean(input.showThumbnails),
	};
}

async function saveAdSettings(settings) {
	await mkdir(path.dirname(adSettingsFilePath), { recursive: true });
	await writeFile(adSettingsFilePath, JSON.stringify(settings, null, 2), "utf8");
}

async function getAdSettings() {
	if (adSettingsCache) return adSettingsCache;

	try {
		const raw = await readFile(adSettingsFilePath, "utf8");
		const parsed = JSON.parse(raw);
		adSettingsCache = normalizeAdSettings(parsed);
		return adSettingsCache;
	} catch {
		adSettingsCache = normalizeAdSettings(defaultAdSettings);
		try {
			await saveAdSettings(adSettingsCache);
		} catch {
			// Ignore initial write failures and keep runtime defaults.
		}
		return adSettingsCache;
	}
}

export async function GET() {
	const settings = await getAdSettings();
	return NextResponse.json({ success: true, data: settings });
}

export async function PUT(request) {
	const body = await request.json();
	const nextSettings = normalizeAdSettings(body);
	adSettingsCache = nextSettings;

	try {
		await saveAdSettings(nextSettings);
	} catch {
		return NextResponse.json(
			{ success: false, message: "تعذر حفظ إعدادات الإعلانات." },
			{ status: 500 }
		);
	}

	return NextResponse.json({
		success: true,
		message: "تم حفظ إعدادات الإعلانات بنجاح.",
		data: nextSettings,
	});
}
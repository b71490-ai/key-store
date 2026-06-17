import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const emailDiagnosticsFilePath = path.join(process.cwd(), "data", "email-debug.json");

const defaultEmailDiagnostics = {
	lastError: null,
	lastOrder: null,
	lastFormcarryStatus: null,
	lastUpdatedAt: null,
};

let emailDiagnosticsCache = null;

async function saveEmailDiagnostics(diagnostics) {
	await mkdir(path.dirname(emailDiagnosticsFilePath), { recursive: true });
	await writeFile(emailDiagnosticsFilePath, JSON.stringify(diagnostics, null, 2), "utf8");
}

export async function getEmailDiagnostics() {
	if (emailDiagnosticsCache) return emailDiagnosticsCache;

	try {
		const raw = await readFile(emailDiagnosticsFilePath, "utf8");
		const parsed = JSON.parse(raw);
		emailDiagnosticsCache = {
			...defaultEmailDiagnostics,
			...parsed,
		};
	} catch {
		emailDiagnosticsCache = { ...defaultEmailDiagnostics };
	}

	return emailDiagnosticsCache;
}

export async function updateEmailDiagnostics(nextDiagnostics) {
	const current = await getEmailDiagnostics();
	emailDiagnosticsCache = {
		...current,
		...nextDiagnostics,
		lastUpdatedAt: new Date().toISOString(),
	};

	try {
		await saveEmailDiagnostics(emailDiagnosticsCache);
	} catch (error) {
		console.error("[orders] Email diagnostics save failed", {
			error: error instanceof Error ? error.message : String(error),
		});
	}

	return emailDiagnosticsCache;
}

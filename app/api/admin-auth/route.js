import crypto from "node:crypto";
import { promises as fs } from "node:fs";
import path from "node:path";
import { NextResponse } from "next/server";

const DATA_FILE = path.join(process.cwd(), "data", "admin-auth.json");
const DEFAULT_USERNAME = "admin";
const DEFAULT_PASSWORD = "123456";

function buildPasswordHash(password, salt) {
  return crypto.pbkdf2Sync(password, salt, 100_000, 64, "sha512").toString("hex");
}

function createPasswordRecord(password) {
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = buildPasswordHash(password, salt);
  return { salt, hash };
}

function isPasswordValid(password, salt, expectedHash) {
  if (!password || !salt || !expectedHash) return false;

  const receivedHash = buildPasswordHash(password, salt);
  const expectedBuffer = Buffer.from(expectedHash, "hex");
  const receivedBuffer = Buffer.from(receivedHash, "hex");

  if (expectedBuffer.length !== receivedBuffer.length) return false;
  return crypto.timingSafeEqual(expectedBuffer, receivedBuffer);
}

async function ensureAuthData() {
  try {
    const raw = await fs.readFile(DATA_FILE, "utf8");
    const parsed = JSON.parse(raw);

    if (!parsed?.username || !parsed?.passwordHash || !parsed?.passwordSalt) {
      throw new Error("invalid auth file");
    }

    return parsed;
  } catch {
    const defaults = createPasswordRecord(DEFAULT_PASSWORD);
    const seed = {
      username: DEFAULT_USERNAME,
      passwordHash: defaults.hash,
      passwordSalt: defaults.salt,
      updatedAt: new Date().toISOString(),
    };

    await fs.mkdir(path.dirname(DATA_FILE), { recursive: true });
    await fs.writeFile(DATA_FILE, JSON.stringify(seed, null, 2), "utf8");

    return seed;
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    const username = String(body?.username ?? "").trim();
    const password = String(body?.password ?? "");

    if (!username || !password) {
      return NextResponse.json({ message: "يرجى إدخال اسم المستخدم وكلمة المرور." }, { status: 400 });
    }

    const authData = await ensureAuthData();

    if (username !== authData.username || !isPasswordValid(password, authData.passwordSalt, authData.passwordHash)) {
      return NextResponse.json({ message: "بيانات الأدمن غير صحيحة." }, { status: 401 });
    }

    return NextResponse.json({ ok: true, message: "تم التحقق بنجاح." });
  } catch {
    return NextResponse.json({ message: "تعذر تسجيل الدخول الآن." }, { status: 500 });
  }
}

export async function PUT(request) {
  try {
    const body = await request.json();
    const currentPassword = String(body?.currentPassword ?? "");
    const newPassword = String(body?.newPassword ?? "");
    const confirmPassword = String(body?.confirmPassword ?? "");

    if (!currentPassword || !newPassword || !confirmPassword) {
      return NextResponse.json({ message: "يرجى تعبئة جميع حقول كلمة المرور." }, { status: 400 });
    }

    if (newPassword.length < 6) {
      return NextResponse.json({ message: "كلمة المرور الجديدة يجب أن تكون 6 أحرف على الأقل." }, { status: 400 });
    }

    if (newPassword !== confirmPassword) {
      return NextResponse.json({ message: "تأكيد كلمة المرور غير مطابق." }, { status: 400 });
    }

    const authData = await ensureAuthData();

    if (!isPasswordValid(currentPassword, authData.passwordSalt, authData.passwordHash)) {
      return NextResponse.json({ message: "كلمة المرور الحالية غير صحيحة." }, { status: 400 });
    }

    if (currentPassword === newPassword) {
      return NextResponse.json({ message: "كلمة المرور الجديدة يجب أن تختلف عن الحالية." }, { status: 400 });
    }

    const nextRecord = createPasswordRecord(newPassword);
    const updatedData = {
      username: authData.username,
      passwordHash: nextRecord.hash,
      passwordSalt: nextRecord.salt,
      updatedAt: new Date().toISOString(),
    };

    await fs.mkdir(path.dirname(DATA_FILE), { recursive: true });
    await fs.writeFile(DATA_FILE, JSON.stringify(updatedData, null, 2), "utf8");

    return NextResponse.json({ ok: true, message: "تم تحديث كلمة المرور بنجاح." });
  } catch {
    return NextResponse.json({ message: "تعذر تحديث كلمة المرور الآن." }, { status: 500 });
  }
}

import { mkdir, unlink, writeFile } from "node:fs/promises";
import fs from "node:fs";
import path from "node:path";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

const publicDirectory = path.join(process.cwd(), "public");
const MAX_IMAGE_SIZE_BYTES = 5 * 1024 * 1024;
const iconCandidates = ["store-icon.svg", "store-icon.png", "store-icon.jpg", "store-icon.jpeg", "store-icon.webp", "store-icon.ico"];

function getSafeExtension(fileName = "") {
  const extension = path.extname(fileName).toLowerCase();
  if ([".svg", ".png", ".jpg", ".jpeg", ".webp", ".ico"].includes(extension)) {
    return extension;
  }
  return ".png";
}

async function removeOtherIconFiles(currentFileName) {
  await Promise.all(
    iconCandidates
      .filter((fileName) => fileName !== currentFileName)
      .map(async (fileName) => {
        const candidatePath = path.join(publicDirectory, fileName);
        if (fs.existsSync(candidatePath)) {
          try {
            await unlink(candidatePath);
          } catch {
            // ignore cleanup failures
          }
        }
      })
  );
}

export async function POST(request) {
  try {
    const formData = await request.formData();
    const file = formData.get("file");

    if (!(file instanceof File)) {
      return NextResponse.json({ success: false, message: "لم يتم استلام ملف الشعار." }, { status: 400 });
    }

    if (!file.type.startsWith("image/")) {
      return NextResponse.json({ success: false, message: "الملف المرفوع ليس صورة." }, { status: 400 });
    }

    if (file.size > MAX_IMAGE_SIZE_BYTES) {
      return NextResponse.json({ success: false, message: "حجم الصورة كبير جداً. الحد الأقصى 5 ميغابايت." }, { status: 413 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const extension = getSafeExtension(file.name);
    const fileName = `store-icon${extension}`;
    const filePath = `/${fileName}`;
    await mkdir(publicDirectory, { recursive: true });
    await writeFile(path.join(publicDirectory, fileName), buffer);
    await removeOtherIconFiles(fileName);

    return NextResponse.json({ success: true, message: "تم حفظ شعار المتجر بنجاح.", data: { filePath } });
  } catch {
    return NextResponse.json({ success: false, message: "حدث خطأ أثناء حفظ الشعار." }, { status: 500 });
  }
}

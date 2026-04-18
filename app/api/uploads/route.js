import { randomUUID } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

const uploadDirectory = path.join(process.cwd(), "public", "uploads", "products");
const MAX_IMAGE_SIZE_BYTES = 5 * 1024 * 1024;

function getSafeExtension(fileName = "") {
  const extension = path.extname(fileName).toLowerCase();
  return extension && extension.length <= 5 ? extension : ".png";
}

export async function POST(request) {
  try {
    const formData = await request.formData();
    const file = formData.get("file");

    if (!(file instanceof File)) {
      return NextResponse.json(
        { success: false, message: "لم يتم استلام ملف الصورة." },
        { status: 400 }
      );
    }

    if (!file.type.startsWith("image/")) {
      return NextResponse.json(
        { success: false, message: "الملف المرفوع ليس صورة." },
        { status: 400 }
      );
    }

    if (file.size > MAX_IMAGE_SIZE_BYTES) {
      return NextResponse.json(
        { success: false, message: "حجم الصورة كبير جدًا. الحد الأقصى 5MB." },
        { status: 413 }
      );
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const fileName = `${Date.now()}-${randomUUID()}${getSafeExtension(file.name)}`;

    try {
      await mkdir(uploadDirectory, { recursive: true });
      await writeFile(path.join(uploadDirectory, fileName), buffer);

      return NextResponse.json({
        success: true,
        message: "تم رفع الصورة بنجاح.",
        data: {
          fileName,
          filePath: `/uploads/products/${fileName}`,
        },
      });
    } catch {
      const inlineDataUrl = `data:${file.type};base64,${buffer.toString("base64")}`;

      return NextResponse.json({
        success: true,
        message: "تم حفظ الصورة بصيغة مدمجة بسبب قيود التخزين على الخادم.",
        data: {
          fileName,
          filePath: inlineDataUrl,
        },
      });
    }
  } catch {
    return NextResponse.json(
      { success: false, message: "حدث خطأ غير متوقع أثناء رفع الصورة." },
      { status: 500 }
    );
  }
}

import { randomUUID } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { NextResponse } from "next/server";

const uploadDirectory = path.join(process.cwd(), "public", "uploads", "products");

function getSafeExtension(fileName = "") {
  const extension = path.extname(fileName).toLowerCase();
  return extension && extension.length <= 5 ? extension : ".png";
}

export async function POST(request) {
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

  const buffer = Buffer.from(await file.arrayBuffer());
  const fileName = `${Date.now()}-${randomUUID()}${getSafeExtension(file.name)}`;

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
}

export const runtime = "nodejs";

import { NextResponse } from "next/server";
import fs from "node:fs";
import path from "node:path";

const publicDirectory = path.join(process.cwd(), "public");
const iconCandidates = [
  "store-icon.svg",
  "store-icon.png",
  "store-icon.jpg",
  "store-icon.jpeg",
  "store-icon.webp",
  "store-icon.ico",
];

function getContentType(fileName) {
  const ext = path.extname(fileName).toLowerCase();
  switch (ext) {
    case ".svg":
      return "image/svg+xml";
    case ".png":
      return "image/png";
    case ".jpg":
    case ".jpeg":
      return "image/jpeg";
    case ".webp":
      return "image/webp";
    case ".ico":
      return "image/x-icon";
    default:
      return "application/octet-stream";
  }
}

export async function GET(request) {
  for (const fileName of iconCandidates) {
    const filePath = path.join(publicDirectory, fileName);
    if (fs.existsSync(filePath)) {
      const fileBuffer = await fs.promises.readFile(filePath);
      return new Response(fileBuffer, {
        status: 200,
        headers: {
          "Content-Type": getContentType(fileName),
          "Cache-Control": "public, max-age=0, must-revalidate",
        },
      });
    }
  }

  return NextResponse.json({ success: false, message: "Icon not found." }, { status: 404 });
}

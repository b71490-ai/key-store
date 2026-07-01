import type { Metadata } from "next";
import { Cairo, Geist, Geist_Mono } from "next/font/google";
import fs from "node:fs";
import path from "node:path";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const cairo = Cairo({
  variable: "--font-cairo",
  subsets: ["arabic", "latin"],
  weight: ["400", "500", "600", "700", "800"],
  display: "swap",
});

const publicDirectory = path.join(process.cwd(), "public");
const iconCandidates = [
  "store-icon.svg",
  "store-icon.png",
  "store-icon.jpg",
  "store-icon.jpeg",
  "store-icon.webp",
  "store-icon.ico",
];

async function getBrandingIconUrl() {
  for (const fileName of iconCandidates) {
    const filePath = path.join(publicDirectory, fileName);
    if (fs.existsSync(filePath)) {
      const stat = await fs.promises.stat(filePath);
      const version = Math.floor(stat.mtimeMs);
      return `/api/site-branding-icon?v=${version}`;
    }
  }
  return "/api/site-branding-icon";
}

const baseMetadata: Metadata = {
  metadataBase: new URL("https://key-store-gamma.vercel.app"),
  title: {
    default: "Key Store | متجر مفاتيح رقمية Premium",
    template: "%s | Key Store",
  },
  description: "متجر عربي Premium لشراء مفاتيح Windows و Microsoft و Adobe والألعاب مع تجربة دفع واضحة وسريعة.",
  keywords: ["مفاتيح رقمية", "Windows keys", "Microsoft Office", "Adobe", "Steam", "Key Store"],
  applicationName: "Key Store",
  authors: [{ name: "Key Store" }],
  creator: "Key Store",
  publisher: "Key Store",
  robots: {
    index: true,
    follow: true,
  },
  openGraph: {
    title: "Key Store | متجر مفاتيح رقمية Premium",
    description: "منتجات رقمية بتصميم SaaS احترافي وتجربة شراء عربية واضحة.",
    url: "https://key-store-gamma.vercel.app",
    siteName: "Key Store",
    images: [
      {
        url: "/opengraph-image.jpg",
        width: 1200,
        height: 630,
        alt: "Key Store Microsoft-style preview",
      },
    ],
    locale: "ar",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Key Store | متجر مفاتيح رقمية Premium",
    description: "مفاتيح برامج وألعاب بتجربة Premium وواجهة عربية RTL.",
    images: ["/opengraph-image.jpg"],
  },
  verification: {
    google: "XfTG-kolUfUSKO545Mxb3J9aefitXBsV_mc316ua9OU",
  },
};

export async function generateMetadata(): Promise<Metadata> {
  const iconUrl = await getBrandingIconUrl();
  return {
    ...baseMetadata,
    icons: {
      icon: iconUrl,
      apple: iconUrl,
      shortcut: iconUrl,
    },
  };
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="ar"
      dir="rtl"
      className={`${geistSans.variable} ${geistMono.variable} ${cairo.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}

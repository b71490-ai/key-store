import type { Metadata } from "next";
import { Cairo, Geist, Geist_Mono } from "next/font/google";
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
});

export const metadata: Metadata = {
  metadataBase: new URL("https://key-store-gamma.vercel.app"),
  title: "Key Store",
  description: "Digital storefront for software keys and license management.",
  icons: {
    icon: "/icon.jpg",
    apple: "/apple-icon.jpg",
    shortcut: "/icon.jpg",
  },
  openGraph: {
    title: "Key Store",
    description: "Digital storefront for software keys and license management.",
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
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Key Store",
    description: "Digital storefront for software keys and license management.",
    images: ["/opengraph-image.jpg"],
  },
  verification: {
    google: "XfTG-kolUfUSKO545Mxb3J9aefitXBsV_mc316ua9OU",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} ${cairo.variable} h-full antialiased`}
    >
      <head>
        {/* eslint-disable-next-line @next/next/no-page-custom-font */}
        <link
          href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}

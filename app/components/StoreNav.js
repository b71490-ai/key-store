"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { FiGrid, FiMoon, FiShoppingBag, FiSun } from "react-icons/fi";

export default function StoreNav() {
	const [theme, setTheme] = useState("light");

	useEffect(() => {
		const savedTheme = window.localStorage.getItem("store-theme");
		const preferredTheme = window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
		const nextTheme = savedTheme || preferredTheme;
		document.documentElement.dataset.theme = nextTheme;
		queueMicrotask(() => setTheme(nextTheme));
	}, []);

	const toggleTheme = () => {
		const nextTheme = theme === "dark" ? "light" : "dark";
		setTheme(nextTheme);
		window.localStorage.setItem("store-theme", nextTheme);
		document.documentElement.dataset.theme = nextTheme;
	};

	return (
		<header className="premium-nav">
			<nav className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between gap-3 px-4">
				<Link href="/" className="flex items-center gap-3">
					<span className="brand-mark">
						<FiShoppingBag />
					</span>
					<span className="font-black text-slate-950 dark-aware-text">Key Store</span>
				</Link>

				<div className="hidden items-center gap-2 rounded-full border border-slate-200/80 bg-white/70 p-1 text-sm font-bold text-slate-600 shadow-sm backdrop-blur md:flex">
					<Link className="nav-pill" href="/">الرئيسية</Link>
					<Link className="nav-pill" href="/products">المنتجات</Link>
					<Link className="nav-pill" href="/checkout">الدفع</Link>
				</div>

				<div className="flex items-center gap-2">
					<Link href="/products" className="nav-icon-btn" aria-label="المنتجات">
						<FiGrid />
					</Link>
					<button type="button" onClick={toggleTheme} className="nav-icon-btn" aria-label="تبديل الوضع">
						{theme === "dark" ? <FiSun /> : <FiMoon />}
					</button>
				</div>
			</nav>
		</header>
	);
}

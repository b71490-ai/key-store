"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FiGrid, FiMoon, FiShoppingBag, FiSun } from "react-icons/fi";

export default function StoreNav() {
	const router = useRouter();
	const [theme, setTheme] = useState("light");
	const hiddenTapCountRef = useRef(0);
	const hiddenTapTimerRef = useRef(null);

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

	const handleHiddenAdminTap = () => {
		hiddenTapCountRef.current += 1;

		if (hiddenTapTimerRef.current) {
			window.clearTimeout(hiddenTapTimerRef.current);
		}

		hiddenTapTimerRef.current = window.setTimeout(() => {
			hiddenTapCountRef.current = 0;
			hiddenTapTimerRef.current = null;
		}, 3000);

		if (hiddenTapCountRef.current >= 5) {
			if (hiddenTapTimerRef.current) {
				window.clearTimeout(hiddenTapTimerRef.current);
				hiddenTapTimerRef.current = null;
			}
			hiddenTapCountRef.current = 0;
			router.push("/admin/login");
		}
	};

	return (
		<header className="premium-nav relative">
			<button
				type="button"
				aria-label="hidden admin access"
				tabIndex={-1}
				onClick={handleHiddenAdminTap}
				className="absolute left-1/2 top-[18px] z-[1] h-20 w-[120px] -translate-x-1/2 cursor-default bg-transparent opacity-0"
			/>
			<nav className="mx-auto flex h-16 w-full max-w-[1200px] items-center justify-between gap-3 px-4">
				<Link href="/" className="flex items-center gap-3">
					<span className="brand-mark">
						<FiShoppingBag />
					</span>
					<span className="font-bold text-slate-950 dark-aware-text">Key Store</span>
				</Link>

				<div className="hidden items-center gap-2 rounded-full border border-slate-200/80 bg-white/70 p-1 text-sm font-semibold text-slate-600 shadow-sm backdrop-blur md:flex">
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

"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import axios from "axios";
import Swal from "sweetalert2";
import {
  FiArrowRight,
  FiBarChart2,
  FiClock,
  FiDatabase,
  FiEdit2,
  FiImage,
  FiLock,
  FiPackage,
  FiPlusCircle,
  FiRefreshCw,
  FiSearch,
  FiShoppingBag,
  FiTrash2,
  FiTrendingUp,
  FiUser,
} from "react-icons/fi";

const ADMIN_USERNAME = "admin";
const ADMIN_PASSWORD = "123456";

const initialForm = {
  productName: "",
  platform: "Windows",
  price: "",
  stock: "",
  delivery: "تسليم فوري",
  guarantee: "ضمان استبدال لمدة 7 أيام",
  description: "",
  image: "",
};

function formatDate(value) {
  if (!value) return "-";
  return new Date(value).toLocaleString("ar-EG", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function AdminPage() {
  const productFormRef = useRef(null);
  const imageInputRef = useRef(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loginError, setLoginError] = useState("");

  const [form, setForm] = useState(initialForm);
  const [isSaving, setIsSaving] = useState(false);
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [isLoadingProducts, setIsLoadingProducts] = useState(true);
  const [isLoadingOrders, setIsLoadingOrders] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [editingProductId, setEditingProductId] = useState(null);
  const [selectedImageFile, setSelectedImageFile] = useState(null);

  const imagePreviewSrc = useMemo(() => {
    const candidate = String(form.image || "").trim();
    return candidate || "/images/real/dev-setup.jpg";
  }, [form.image]);

  const fetchProducts = async () => {
    try {
      setIsLoadingProducts(true);
      const response = await axios.get("/api/keys");
      setProducts(response.data?.data ?? []);
    } catch {
      setProducts([]);
    } finally {
      setIsLoadingProducts(false);
    }
  };

  const fetchOrders = async () => {
    try {
      setIsLoadingOrders(true);
      const response = await axios.get("/api/orders");
      setOrders(response.data?.data ?? []);
    } catch {
      setOrders([]);
    } finally {
      setIsLoadingOrders(false);
    }
  };

  useEffect(() => {
    if (typeof window === "undefined") return;
    setIsAuthenticated(window.sessionStorage.getItem("admin-auth") === "ok");
  }, []);

  useEffect(() => {
    if (!isAuthenticated) return;
    fetchProducts();
    fetchOrders();
  }, [isAuthenticated]);

  const filteredProducts = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    if (!term) return products;

    return products.filter((item) => {
      const byName = String(item.productName ?? "").toLowerCase();
      const byPlatform = String(item.platform ?? "").toLowerCase();
      return byName.includes(term) || byPlatform.includes(term);
    });
  }, [products, searchTerm]);

  const stats = useMemo(() => {
    const lowStockCount = products.filter((item) => Number(item.stock) <= 10).length;
    const totalStock = products.reduce((sum, item) => sum + Number(item.stock || 0), 0);
    const totalRevenue = orders.reduce((sum, orderItem) => sum + Number(orderItem?.order?.totalPrice || 0), 0);

    return {
      totalProducts: products.length,
      lowStockCount,
      totalStock,
      ordersCount: orders.length,
      totalRevenue,
    };
  }, [products, orders]);

  const handleLogin = async (event) => {
    event.preventDefault();

    if (!username.trim() || !password.trim()) {
      setLoginError("يرجى إدخال اسم المستخدم وكلمة المرور.");
      return;
    }

    if (username.trim() !== ADMIN_USERNAME || password !== ADMIN_PASSWORD) {
      setLoginError("بيانات الأدمن غير صحيحة.");
      return;
    }

    window.sessionStorage.setItem("admin-auth", "ok");
    setIsAuthenticated(true);
    setLoginError("");

    await Swal.fire({
      title: "تم تسجيل الدخول",
      text: "مرحبًا بك في لوحة الإدارة.",
      icon: "success",
      confirmButtonText: "متابعة",
      confirmButtonColor: "#1475d1",
    });
  };

  const handleLogout = () => {
    window.sessionStorage.removeItem("admin-auth");
    setIsAuthenticated(false);
    setUsername("");
    setPassword("");
  };

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  };

  const handleImageSelection = async (event) => {
    const file = event.target.files?.[0];

    if (!file) return;

    if (!file.type.startsWith("image/")) {
      await Swal.fire({
        title: "ملف غير صالح",
        text: "يرجى اختيار صورة من الجهاز أو الألبوم فقط.",
        icon: "warning",
        confirmButtonText: "حسنًا",
        confirmButtonColor: "#f59e0b",
      });
      event.target.value = "";
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setForm((current) => ({
        ...current,
        image: typeof reader.result === "string" ? reader.result : current.image,
      }));
    };
    reader.readAsDataURL(file);
    setSelectedImageFile(file);
  };

  const clearSelectedImage = () => {
    setForm((current) => ({ ...current, image: "" }));
    setSelectedImageFile(null);
    if (imageInputRef.current) {
      imageInputRef.current.value = "";
    }
  };

  const startEditingProduct = (item) => {
    setEditingProductId(item.id);
    setForm({
      productName: item.productName ?? "",
      platform: item.platform ?? "General",
      price: String(item.price ?? ""),
      stock: String(item.stock ?? ""),
      delivery: item.delivery ?? "تسليم فوري",
      guarantee: item.guarantee ?? "ضمان استبدال لمدة 7 أيام",
      description: item.description ?? "",
      image: item.image ?? "",
    });
    setSelectedImageFile(null);

    requestAnimationFrame(() => {
      productFormRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  };

  const cancelEditing = () => {
    setEditingProductId(null);
    setForm(initialForm);
    setSelectedImageFile(null);
    if (imageInputRef.current) {
      imageInputRef.current.value = "";
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    try {
      setIsSaving(true);
      let imagePath = form.image || undefined;

      if (selectedImageFile) {
        const uploadFormData = new FormData();
        uploadFormData.append("file", selectedImageFile);

        const uploadResponse = await axios.post("/api/uploads", uploadFormData);
        imagePath = uploadResponse.data?.data?.filePath || imagePath;
      }

      const payload = {
        productName: form.productName,
        platform: form.platform,
        price: Number(form.price),
        stock: Number(form.stock || 0),
        delivery: form.delivery,
        guarantee: form.guarantee,
        description: form.description,
        image: imagePath,
      };

      const response = editingProductId
        ? await axios.put(`/api/keys?id=${editingProductId}`, payload)
        : await axios.post("/api/keys", payload);

      setForm(initialForm);
      setEditingProductId(null);
      setSelectedImageFile(null);
      if (imageInputRef.current) {
        imageInputRef.current.value = "";
      }
      await fetchProducts();

      await Swal.fire({
        title: editingProductId ? "تم التحديث" : "تمت الإضافة",
        text: editingProductId
          ? `${response.data?.data?.productName ?? "المنتج"} تم تحديثه بنجاح.`
          : `${response.data?.data?.productName ?? "المنتج"} أصبح متاحًا الآن.`,
        icon: "success",
        confirmButtonText: "ممتاز",
        confirmButtonColor: "#2563eb",
      });
    } catch (error) {
      const message = error?.response?.data?.message || "تعذر حفظ المنتج، حاول مجددًا.";
      await Swal.fire({
        title: "فشل الحفظ",
        text: message,
        icon: "error",
        confirmButtonText: "حسنًا",
        confirmButtonColor: "#dc2626",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteProduct = async (productId, productName) => {
    const confirmResult = await Swal.fire({
      title: "تأكيد الحذف",
      text: `هل تريد حذف المنتج ${productName}؟`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "نعم، حذف",
      cancelButtonText: "إلغاء",
      confirmButtonColor: "#dc2626",
    });

    if (!confirmResult.isConfirmed) return;

    try {
      await axios.delete(`/api/keys?id=${productId}`);
      setProducts((current) => current.filter((item) => item.id !== productId));
    } catch (error) {
      const message = error?.response?.data?.message || "تعذر حذف المنتج، حاول مجددًا.";
      await Swal.fire({
        title: "فشل الحذف",
        text: message,
        icon: "error",
        confirmButtonText: "حسنًا",
        confirmButtonColor: "#dc2626",
      });
    }
  };

  if (!isAuthenticated) {
    return (
      <main className="min-h-screen bg-[#f4f4f5] px-4 py-10 text-slate-800" dir="rtl">
        <div className="mx-auto w-full max-w-xl rounded-3xl border border-slate-200 bg-white p-7 shadow-[0_18px_45px_-30px_rgba(0,0,0,0.35)] md:p-8">
          <div className="text-center">
            <div className="mx-auto inline-flex rounded-full bg-blue-50 p-3">
              <FiLock className="text-2xl text-[#1475d1]" />
            </div>
            <h1 className="mt-4 text-3xl font-extrabold tracking-tight">تسجيل دخول الأدمن</h1>
          </div>

          <form onSubmit={handleLogin} className="mt-8 grid gap-4">
            <label className="text-sm font-semibold text-slate-700">
              اسم المستخدم
              <div className="relative mt-2">
                <FiUser className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  value={username}
                  onChange={(event) => setUsername(event.target.value)}
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 py-3 pl-4 pr-11 outline-none transition focus:border-[#1475d1]"
                  placeholder="admin"
                />
              </div>
            </label>

            <label className="text-sm font-semibold text-slate-700">
              كلمة المرور
              <div className="relative mt-2">
                <FiLock className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 py-3 pl-4 pr-11 outline-none transition focus:border-[#1475d1]"
                  placeholder="******"
                />
              </div>
            </label>

            {loginError ? <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">{loginError}</div> : null}

            <button type="submit" className="mt-2 inline-flex items-center justify-center rounded-full bg-[#1475d1] px-6 py-3 font-bold text-white transition hover:bg-[#0f5ca8]">
              دخول لوحة التحكم
            </button>
          </form>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#f4f4f5] px-4 py-10 text-slate-800" dir="rtl">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-6">
        <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"><div className="text-xs text-slate-500">إجمالي المنتجات</div><div className="mt-2 flex items-center justify-between"><span className="text-2xl font-extrabold">{stats.totalProducts}</span><FiPackage className="text-xl text-[#1475d1]" /></div></div>
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"><div className="text-xs text-slate-500">إجمالي المخزون</div><div className="mt-2 flex items-center justify-between"><span className="text-2xl font-extrabold">{stats.totalStock}</span><FiBarChart2 className="text-xl text-emerald-600" /></div></div>
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"><div className="text-xs text-slate-500">منخفض المخزون</div><div className="mt-2 flex items-center justify-between"><span className="text-2xl font-extrabold">{stats.lowStockCount}</span><FiTrendingUp className="text-xl text-amber-600" /></div></div>
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"><div className="text-xs text-slate-500">الطلبات</div><div className="mt-2 flex items-center justify-between"><span className="text-2xl font-extrabold">{stats.ordersCount}</span><FiShoppingBag className="text-xl text-violet-600" /></div></div>
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"><div className="text-xs text-slate-500">المبيعات</div><div className="mt-2 flex items-center justify-between"><span className="text-2xl font-extrabold">${stats.totalRevenue}</span><FiDatabase className="text-xl text-cyan-600" /></div></div>
        </section>

        <section className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
          <section className="rounded-3xl bg-[#0f3b78] p-8 text-white shadow-[0_18px_45px_-30px_rgba(0,0,0,0.5)]">
            <div className="mb-4 flex justify-start"><button type="button" onClick={handleLogout} className="rounded-full border border-white/30 px-4 py-2 text-xs font-bold text-white transition hover:bg-white/10">تسجيل خروج الأدمن</button></div>
            <h1 className="text-4xl font-extrabold tracking-tight">لوحة التحكم</h1>
            <p className="mt-4 text-sm leading-8 text-blue-100">إدارة المنتجات والطلبات من شاشة واحدة.</p>
            <div className="mt-6 flex flex-wrap gap-2">
              <Link href="/products" className="inline-flex items-center gap-2 rounded-full bg-white px-5 py-3 text-sm font-bold text-[#0f3b78] transition hover:bg-blue-100">عرض المنتجات<FiArrowRight /></Link>
              <button type="button" onClick={fetchProducts} className="inline-flex items-center gap-2 rounded-full border border-white/35 px-5 py-3 text-sm font-bold text-white transition hover:bg-white/10"><FiRefreshCw /> تحديث المنتجات</button>
              <button type="button" onClick={fetchOrders} className="inline-flex items-center gap-2 rounded-full border border-white/35 px-5 py-3 text-sm font-bold text-white transition hover:bg-white/10"><FiRefreshCw /> تحديث الطلبات</button>
            </div>
          </section>

          <form ref={productFormRef} onSubmit={handleSubmit} className="rounded-3xl border border-slate-200 bg-white p-7 shadow-[0_18px_45px_-30px_rgba(0,0,0,0.35)] md:p-8">
            <div className="flex items-center gap-3"><div className="rounded-xl bg-blue-50 p-3">{editingProductId ? <FiEdit2 className="text-2xl text-[#1475d1]" /> : <FiPlusCircle className="text-2xl text-[#1475d1]" />}</div><h2 className="text-2xl font-extrabold tracking-tight">{editingProductId ? "تعديل منتج" : "إضافة منتج جديد"}</h2></div>
            <div className="mt-8 grid gap-4 md:grid-cols-2">
              <input name="productName" value={form.productName} onChange={handleChange} required className="md:col-span-2 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none transition focus:border-[#1475d1]" placeholder="اسم المنتج" />
              <select name="platform" value={form.platform} onChange={handleChange} className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none transition focus:border-[#1475d1]"><option>Windows</option><option>Microsoft</option><option>Steam</option><option>Adobe</option><option>General</option></select>
              <input name="price" value={form.price} onChange={handleChange} required type="number" min="1" max="15" step="0.01" className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none transition focus:border-[#1475d1]" placeholder="السعر (حتى 15$)" />
              <input name="stock" value={form.stock} onChange={handleChange} type="number" min="0" className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none transition focus:border-[#1475d1]" placeholder="المخزون" />
              <input name="delivery" value={form.delivery} onChange={handleChange} className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none transition focus:border-[#1475d1]" placeholder="التسليم" />
              <input name="guarantee" value={form.guarantee} onChange={handleChange} className="md:col-span-2 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none transition focus:border-[#1475d1]" placeholder="الضمان" />
              <textarea name="description" value={form.description} onChange={handleChange} rows={3} className="md:col-span-2 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none transition focus:border-[#1475d1]" placeholder="الوصف" />
              <div className="md:col-span-2 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <div className="mb-3 text-sm font-bold text-slate-700">معاينة الصورة</div>
                <div className="grid gap-4 md:grid-cols-[140px_1fr]">
                  <div
                    className="h-[92px] rounded-xl border border-slate-200 bg-cover bg-center"
                    style={{ backgroundImage: `url(${imagePreviewSrc})` }}
                  />
                  <div className="space-y-1 text-xs text-slate-500">
                    <p>{editingProductId ? "هذه هي صورة المنتج الحالية. يمكنك استبدالها من ملفات الجهاز أو الألبوم وسيتم رفعها وحفظها داخل المشروع." : "اختر صورة من جهازك أو الألبوم وسيتم رفعها وحفظها داخل المشروع مباشرة."}</p>
                    <p className="break-all">الحالة الحالية: {selectedImageFile ? `تم اختيار ملف جديد: ${selectedImageFile.name}` : form.image ? "الصورة الحالية محفوظة للمنتج" : "سيتم استخدام الصورة الافتراضية"}</p>
                    <div className="flex flex-wrap items-center gap-2 pt-2">
                      <label className="inline-flex cursor-pointer items-center gap-2 rounded-full bg-[#1475d1] px-4 py-2 text-xs font-bold text-white transition hover:bg-[#0f5ca8]">
                        <FiImage />
                        اختيار صورة من الملفات
                        <input ref={imageInputRef} type="file" accept="image/*" onChange={handleImageSelection} className="hidden" />
                      </label>
                      {form.image ? (
                        <button
                          type="button"
                          onClick={clearSelectedImage}
                          className="inline-flex items-center gap-2 rounded-full border border-slate-300 bg-white px-4 py-2 text-xs font-bold text-slate-700 transition hover:bg-slate-100"
                        >
                          إزالة الصورة
                        </button>
                      ) : null}
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <button type="submit" disabled={isSaving} className="inline-flex items-center justify-center rounded-full bg-[#1475d1] px-6 py-3 font-bold text-white transition hover:bg-[#0f5ca8] disabled:cursor-not-allowed disabled:opacity-70">{isSaving ? "جارٍ الحفظ..." : editingProductId ? "تحديث المنتج" : "حفظ المنتج"}</button>
              {editingProductId ? (
                <button type="button" onClick={cancelEditing} className="inline-flex items-center justify-center rounded-full border border-slate-300 bg-white px-6 py-3 font-bold text-slate-700 transition hover:bg-slate-50">
                  إلغاء التعديل
                </button>
              ) : null}
            </div>
          </form>
        </section>

        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3"><h2 className="text-xl font-extrabold tracking-tight">إدارة المنتجات</h2><div className="relative w-full sm:w-72"><FiSearch className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" /><input value={searchTerm} onChange={(event) => setSearchTerm(event.target.value)} className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-3 pr-10 text-sm outline-none focus:border-[#1475d1]" placeholder="بحث" /></div></div>
          {isLoadingProducts ? <div className="mt-5 rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-500">جاري تحميل المنتجات...</div> : null}
          {!isLoadingProducts && filteredProducts.length ? (
            <div className="mt-5 overflow-x-auto"><table className="min-w-full text-right text-sm"><thead><tr className="border-b border-slate-200 text-slate-500"><th className="px-3 py-3">الصورة</th><th className="px-3 py-3">المنتج</th><th className="px-3 py-3">المنصة</th><th className="px-3 py-3">السعر</th><th className="px-3 py-3">المخزون</th><th className="px-3 py-3">إجراء</th></tr></thead><tbody>{filteredProducts.map((item) => (<tr key={item.id} className="border-b border-slate-100"><td className="px-3 py-3"><div className="h-12 w-20 rounded-lg border border-slate-200 bg-cover bg-center" style={{ backgroundImage: `url(${item.image || "/images/real/dev-setup.jpg"})` }} /></td><td className="px-3 py-3 font-semibold text-slate-800">{item.productName}</td><td className="px-3 py-3 text-slate-600">{item.platform}</td><td className="px-3 py-3 text-slate-600">${item.price}</td><td className="px-3 py-3 text-slate-600">{item.stock}</td><td className="px-3 py-3"><div className="flex flex-wrap items-center gap-2"><button type="button" onClick={() => startEditingProduct(item)} className="inline-flex items-center gap-2 rounded-lg border border-blue-200 px-3 py-2 text-xs font-bold text-blue-700 transition hover:bg-blue-50"><FiEdit2 /> تعديل</button><button type="button" onClick={() => handleDeleteProduct(item.id, item.productName)} className="inline-flex items-center gap-2 rounded-lg border border-red-200 px-3 py-2 text-xs font-bold text-red-600 transition hover:bg-red-50"><FiTrash2 /> حذف</button></div></td></tr>))}</tbody></table></div>
          ) : null}
        </section>

        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between gap-3"><h2 className="text-xl font-extrabold tracking-tight">الطلبات الأخيرة</h2><button type="button" onClick={fetchOrders} className="inline-flex items-center gap-2 rounded-full border border-slate-300 px-4 py-2 text-xs font-bold text-slate-700 transition hover:bg-slate-50"><FiRefreshCw /> تحديث</button></div>
          {isLoadingOrders ? <div className="mt-5 rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-500">جاري تحميل الطلبات...</div> : null}
          {!isLoadingOrders && orders.length ? (
            <div className="mt-5 grid gap-3 md:grid-cols-2">{orders.slice(0, 8).map((orderItem) => (<article key={orderItem.orderId} className="rounded-2xl border border-slate-200 bg-slate-50 p-4"><div className="text-xs text-slate-500">{orderItem.orderId}</div><h3 className="mt-1 font-bold text-slate-800">{orderItem.order?.productName}</h3><div className="mt-3 space-y-1 text-sm text-slate-600"><div>العميل: {orderItem.customer?.name || "-"}</div><div>الإيميل: {orderItem.customer?.email || "-"}</div><div>الإجمالي: ${orderItem.order?.totalPrice ?? "-"}</div></div><div className="mt-3 inline-flex items-center gap-2 text-xs text-slate-500"><FiClock />{formatDate(orderItem.createdAt)}</div></article>))}</div>
          ) : null}
        </section>
      </div>
    </main>
  );
}

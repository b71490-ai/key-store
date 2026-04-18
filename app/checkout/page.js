"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";

function CheckoutContent() {
  const searchParams = useSearchParams();
  const [cart, setCart] = useState([]);
  const [loading, setLoading] = useState(true);

  const userId = searchParams.get("user") || "guest@keystore.local";
  const productName = searchParams.get("product");
  const productPrice = Number(searchParams.get("price") || 0);
  const productImage = searchParams.get("image") || "";

  useEffect(() => {
    let isMounted = true;

    const loadCart = async () => {
      setLoading(true);

      try {
        if (productName) {
          await fetch("/api/cart", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              userId,
              item: {
                name: productName,
                price: Number.isFinite(productPrice) ? productPrice : 0,
                image: productImage,
                quantity: 1,
              },
            }),
          });
        }

        const response = await fetch(`/api/cart?userId=${encodeURIComponent(userId)}`, {
          cache: "no-store",
        });
        const result = await response.json();

        if (isMounted) {
          setCart(Array.isArray(result?.data) ? result.data : []);
        }
      } catch {
        if (isMounted) {
          setCart([]);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    loadCart();

    return () => {
      isMounted = false;
    };
  }, [productImage, productName, productPrice, userId]);

  if (loading) {
    return <div>جاري تحميل السلة...</div>;
  }

  if (!cart || cart.length === 0) {
    return <div>السلة فارغة</div>;
  }

  return (
    <div>
      <h1>Checkout Page</h1>
      {cart.map((item, index) => (
        <div key={index}>{item.name}</div>
      ))}
    </div>
  );
}

export default function Checkout() {
  return (
    <Suspense fallback={<div>جاري تحميل الصفحة...</div>}>
      <CheckoutContent />
    </Suspense>
  );
}

"use client";

import { useEffect, useState } from "react";

export default function Checkout() {
  const [cart, setCart] = useState(null);

  useEffect(() => {
    const data = localStorage.getItem("cart");
    if (data) {
      setCart(JSON.parse(data));
    } else {
      setCart([]);
    }
  }, []);

  // ⛔ لسه ما حمل البيانات
  if (cart === null) {
    return <div>جاري التحميل...</div>;
  }

  // 🛒 السلة فاضية
  if (cart.length === 0) {
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

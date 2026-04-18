"use client";

import { useEffect, useState } from "react";

export default function Checkout() {
  const [cart, setCart] = useState([]);

  useEffect(() => {
    const data = localStorage.getItem("cart");
    if (data) {
      setCart(JSON.parse(data));
    }
  }, []);

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

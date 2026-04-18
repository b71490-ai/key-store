import { NextResponse } from "next/server";

const cartsStore = new Map();

function getUserId(searchParams) {
  return searchParams.get("userId") || "guest";
}

function normalizeItem(rawItem) {
  const name = String(rawItem?.name || "").trim();
  if (!name) return null;

  const parsedPrice = Number(rawItem?.price ?? 0);

  return {
    id: String(rawItem?.id || `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`),
    name,
    price: Number.isFinite(parsedPrice) ? parsedPrice : 0,
    image: String(rawItem?.image || ""),
    quantity: Math.max(1, Number(rawItem?.quantity || 1)),
  };
}

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const userId = getUserId(searchParams);
  const cart = cartsStore.get(userId) || [];

  return NextResponse.json({
    success: true,
    userId,
    count: cart.length,
    data: cart,
  });
}

export async function POST(request) {
  const body = await request.json();
  const userId = String(body?.userId || "guest").trim() || "guest";
  const item = normalizeItem(body?.item);

  if (!item) {
    return NextResponse.json(
      { success: false, message: "بيانات المنتج غير صالحة." },
      { status: 400 }
    );
  }

  const cart = cartsStore.get(userId) || [];
  const existingIndex = cart.findIndex((entry) => entry.name === item.name);

  if (existingIndex >= 0) {
    cart[existingIndex] = {
      ...cart[existingIndex],
      quantity: cart[existingIndex].quantity + item.quantity,
      price: item.price,
      image: item.image || cart[existingIndex].image,
    };
  } else {
    cart.push(item);
  }

  cartsStore.set(userId, cart);

  return NextResponse.json(
    {
      success: true,
      message: "تم تحديث السلة بنجاح.",
      userId,
      count: cart.length,
      data: cart,
    },
    { status: 201 }
  );
}

export async function DELETE(request) {
  const { searchParams } = new URL(request.url);
  const userId = getUserId(searchParams);
  cartsStore.set(userId, []);

  return NextResponse.json({
    success: true,
    message: "تم تفريغ السلة.",
    userId,
    data: [],
  });
}
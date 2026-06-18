"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";

type Product = {
  id: number;
  name: string;
  category: "Sticker" | "Theme";
  image: string;
  regularPrice: number;
  salePrice?: number;
  promotionEnd?: string;
  slug: string;
  isBestSeller: boolean;
};

type SupabaseProduct = {
  id: number;
  name: string;
  category: "Sticker" | "Theme";
  image: string;
  regular_price: number | string;
  sale_price: number | string | null;
  promotion_end: string | null;
  slug: string;
  is_best_seller: boolean;
};

type CartItem = Product & {
  quantity: number;
};

type CategoryFilter = "all" | "Sticker" | "Theme";
type SpecialFilter = "all" | "promotion" | "best-seller";
type SortOption = "newest" | "price-low" | "price-high" | "name";

const CART_STORAGE_KEY = "queenb-cart";

function formatPrice(price: number) {
  return new Intl.NumberFormat("th-TH").format(price);
}

function isPromotionActive(product: Product) {
  if (product.salePrice === undefined || !product.promotionEnd) {
    return false;
  }

  const end = new Date(`${product.promotionEnd}T23:59:59`);
  return new Date() <= end;
}

function getCurrentPrice(product: Product) {
  return isPromotionActive(product) && product.salePrice !== undefined
    ? product.salePrice
    : product.regularPrice;
}

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState<CategoryFilter>("all");
  const [special, setSpecial] = useState<SpecialFilter>("all");
  const [sortBy, setSortBy] = useState<SortOption>("newest");
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [cartOpen, setCartOpen] = useState(false);

  useEffect(() => {
    const savedCart = localStorage.getItem(CART_STORAGE_KEY);

    if (savedCart) {
      try {
        setCart(JSON.parse(savedCart));
      } catch {
        localStorage.removeItem(CART_STORAGE_KEY);
      }
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart));
  }, [cart]);

  useEffect(() => {
    const loadProducts = async () => {
      setLoading(true);
      setErrorMessage("");

      const { data, error } = await supabase
        .from("products")
        .select(
          `
            id,
            name,
            category,
            image,
            regular_price,
            sale_price,
            promotion_end,
            slug,
            is_best_seller
          `,
        )
        .eq("is_active", true)
        .order("id", { ascending: false });

      if (error) {
        console.error(error);
        setErrorMessage("ไม่สามารถโหลดสินค้าได้ กรุณาลองใหม่อีกครั้ง");
        setLoading(false);
        return;
      }

      const formatted = ((data ?? []) as SupabaseProduct[]).map((product) => ({
        id: product.id,
        name: product.name,
        category: product.category,
        image: product.image,
        regularPrice: Number(product.regular_price),
        salePrice:
          product.sale_price === null
            ? undefined
            : Number(product.sale_price),
        promotionEnd: product.promotion_end ?? undefined,
        slug: product.slug,
        isBestSeller: product.is_best_seller,
      }));

      setProducts(formatted);
      setLoading(false);
    };

    loadProducts();
  }, []);

  const filteredProducts = useMemo(() => {
    const keyword = search.trim().toLowerCase();

    const result = products.filter((product) => {
      const matchesSearch =
        keyword.length === 0 ||
        product.name.toLowerCase().includes(keyword);

      const matchesCategory =
        category === "all" || product.category === category;

      const matchesSpecial =
        special === "all" ||
        (special === "promotion" && isPromotionActive(product)) ||
        (special === "best-seller" && product.isBestSeller);

      return matchesSearch && matchesCategory && matchesSpecial;
    });

    return [...result].sort((a, b) => {
      if (sortBy === "price-low") {
        return getCurrentPrice(a) - getCurrentPrice(b);
      }

      if (sortBy === "price-high") {
        return getCurrentPrice(b) - getCurrentPrice(a);
      }

      if (sortBy === "name") {
        return a.name.localeCompare(b.name, "th");
      }

      return b.id - a.id;
    });
  }, [products, search, category, special, sortBy]);

  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  const cartTotal = cart.reduce(
    (sum, item) => sum + getCurrentPrice(item) * item.quantity,
    0,
  );

  const addToCart = (product: Product) => {
    setCart((current) => {
      const existing = current.find((item) => item.id === product.id);

      if (existing) {
        return current.map((item) =>
          item.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item,
        );
      }

      return [...current, { ...product, quantity: 1 }];
    });

    setCartOpen(true);
  };

  const updateQuantity = (id: number, amount: number) => {
    setCart((current) =>
      current
        .map((item) =>
          item.id === id
            ? { ...item, quantity: Math.max(0, item.quantity + amount) }
            : item,
        )
        .filter((item) => item.quantity > 0),
    );
  };

  const clearFilters = () => {
    setSearch("");
    setCategory("all");
    setSpecial("all");
    setSortBy("newest");
  };

  return (
    <main className="min-h-screen bg-[#fff9f5] text-[#4f4144]">
      <header className="sticky top-0 z-40 border-b border-[#f4dfe6] bg-[#fff9f5]/95 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3 sm:px-6">
          <Link href="/" className="flex min-w-0 items-center gap-3">
            <img
              src="/images/logo-icon.png"
              alt="queenb.sticker logo"
              className="h-11 w-11 shrink-0 rounded-2xl object-contain shadow-sm"
            />

            <div className="min-w-0">
              <p className="truncate text-base font-bold text-[#df6f91] sm:text-lg">
                queenb.sticker
              </p>
              <p className="truncate text-[11px] text-[#806d72] sm:text-xs">
                Cute stickers & LINE themes
              </p>
            </div>
          </Link>

          <div className="flex items-center gap-2">
            <Link
              href="/"
              className="hidden rounded-full border border-[#ead1d9] bg-white px-4 py-2 text-sm font-semibold text-[#7d666e] transition hover:bg-[#fff3f7] sm:inline-flex"
            >
              กลับหน้าแรก
            </Link>

            <button
              type="button"
              onClick={() => setCartOpen(true)}
              className="relative rounded-full bg-[#df6f91] px-4 py-2 text-sm font-bold text-white transition hover:bg-[#d35d82]"
            >
              ตะกร้า
              {cartCount > 0 && (
                <span className="ml-2 rounded-full bg-white px-2 py-0.5 text-xs text-[#df6f91]">
                  {cartCount}
                </span>
              )}
            </button>
          </div>
        </div>
      </header>

      <section className="px-4 pb-8 pt-9 sm:px-6 sm:pt-12">
        <div className="mx-auto max-w-6xl rounded-[34px] border border-[#f1dbe3] bg-gradient-to-br from-[#fff0f5] via-white to-[#fff8e5] px-6 py-10 text-center shadow-[0_16px_45px_rgba(171,104,127,0.08)] sm:px-10 sm:py-12">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#d46b8d] sm:text-sm">
            All Products
          </p>

          <h1 className="mt-3 text-3xl font-extrabold tracking-[-0.02em] text-[#4f4144] sm:text-4xl">
            สินค้าทั้งหมด
          </h1>

          <p className="mx-auto mt-4 max-w-xl text-sm leading-7 text-[#806d72] sm:text-[15px]">
            เลือกชมสติกเกอร์และธีม LINE ทั้งหมดของร้าน
            ค้นหาและกรองสินค้าได้ตามต้องการ
          </p>
        </div>
      </section>

      <section className="px-4 pb-6 sm:px-6">
        <div className="mx-auto max-w-6xl rounded-[28px] border border-[#f0d8e0] bg-white p-4 shadow-sm sm:p-5">
          <div className="grid gap-3 lg:grid-cols-[1.5fr_1fr_1fr_1fr]">
            <label className="relative block">
              <span className="sr-only">ค้นหาสินค้า</span>
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="ค้นหาชื่อสินค้า..."
                className="h-12 w-full rounded-2xl border border-[#ecd6de] bg-[#fffafb] px-4 text-sm outline-none transition placeholder:text-[#b29da4] focus:border-[#df6f91] focus:ring-2 focus:ring-[#f8dce5]"
              />
            </label>

            <select
              value={category}
              onChange={(event) =>
                setCategory(event.target.value as CategoryFilter)
              }
              className="h-12 rounded-2xl border border-[#ecd6de] bg-white px-4 text-sm font-medium text-[#66545a] outline-none focus:border-[#df6f91]"
            >
              <option value="all">ทุกประเภท</option>
              <option value="Sticker">LINE Sticker</option>
              <option value="Theme">LINE Theme</option>
            </select>

            <select
              value={special}
              onChange={(event) =>
                setSpecial(event.target.value as SpecialFilter)
              }
              className="h-12 rounded-2xl border border-[#ecd6de] bg-white px-4 text-sm font-medium text-[#66545a] outline-none focus:border-[#df6f91]"
            >
              <option value="all">สินค้าทั้งหมด</option>
              <option value="promotion">เฉพาะโปรโมชั่น</option>
              <option value="best-seller">เฉพาะ Best Seller</option>
            </select>

            <select
              value={sortBy}
              onChange={(event) =>
                setSortBy(event.target.value as SortOption)
              }
              className="h-12 rounded-2xl border border-[#ecd6de] bg-white px-4 text-sm font-medium text-[#66545a] outline-none focus:border-[#df6f91]"
            >
              <option value="newest">ใหม่ล่าสุด</option>
              <option value="price-low">ราคาต่ำไปสูง</option>
              <option value="price-high">ราคาสูงไปต่ำ</option>
              <option value="name">เรียงตามชื่อ</option>
            </select>
          </div>

          <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-[#806d72]">
              พบสินค้า{" "}
              <span className="font-bold text-[#df6f91]">
                {filteredProducts.length}
              </span>{" "}
              รายการ
            </p>

            {(search ||
              category !== "all" ||
              special !== "all" ||
              sortBy !== "newest") && (
              <button
                type="button"
                onClick={clearFilters}
                className="text-sm font-semibold text-[#c75d84] underline-offset-4 hover:underline"
              >
                ล้างตัวกรอง
              </button>
            )}
          </div>
        </div>
      </section>

      <section className="px-4 pb-16 sm:px-6">
        <div className="mx-auto max-w-6xl">
          {loading ? (
            <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
              {[1, 2, 3, 4, 5, 6, 7, 8].map((item) => (
                <div
                  key={item}
                  className="aspect-[3/4] animate-pulse rounded-[26px] bg-white shadow-sm"
                />
              ))}
            </div>
          ) : errorMessage ? (
            <div className="rounded-[28px] border border-[#f1dbe3] bg-white px-6 py-14 text-center">
              <p className="font-semibold text-[#d35f82]">{errorMessage}</p>
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="rounded-[28px] border border-[#f1dbe3] bg-white px-6 py-14 text-center shadow-sm">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#fff1f5] text-2xl">
                ♡
              </div>
              <h2 className="mt-4 text-xl font-bold">ไม่พบสินค้าที่ค้นหา</h2>
              <p className="mt-2 text-sm text-[#806d72]">
                ลองเปลี่ยนคำค้นหาหรือล้างตัวกรองค่ะ
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
              {filteredProducts.map((product) => {
                const promotionActive = isPromotionActive(product);
                const currentPrice = getCurrentPrice(product);
                const inCart = cart.some((item) => item.id === product.id);

                return (
                  <article
                    key={product.id}
                    className="group flex h-full flex-col overflow-hidden rounded-[26px] border border-[#f0d8e0] bg-white shadow-[0_8px_24px_rgba(148,93,112,0.08)] transition hover:-translate-y-1 hover:shadow-[0_14px_30px_rgba(148,93,112,0.13)]"
                  >
                    <Link
                      href={`/product/${product.slug}`}
                      className="relative block aspect-square overflow-hidden bg-[#fff1f5]"
                    >
                      <img
                        src={product.image}
                        alt={product.name}
                        className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
                      />

                      <div className="absolute left-2.5 top-2.5 flex flex-col gap-1.5">
                        {promotionActive && (
                          <span className="w-fit rounded-full bg-[#df6f91] px-2.5 py-1 text-[10px] font-bold text-white shadow-sm sm:text-xs">
                            PROMO
                          </span>
                        )}

                        {product.isBestSeller && (
                          <span className="w-fit rounded-full bg-[#fff1c9] px-2.5 py-1 text-[10px] font-bold text-[#a87510] shadow-sm sm:text-xs">
                            BEST SELLER
                          </span>
                        )}
                      </div>
                    </Link>

                    <div className="flex flex-1 flex-col p-3.5 sm:p-4">
                      <p className="text-[11px] font-semibold uppercase tracking-[0.06em] text-[#d46b8d]">
                        {product.category === "Sticker"
                          ? "LINE Sticker"
                          : "LINE Theme"}
                      </p>

                      <Link
                        href={`/product/${product.slug}`}
                        className="mt-1.5 line-clamp-2 text-sm font-bold leading-5 text-[#4f4144] transition hover:text-[#d65f84] sm:text-base sm:leading-6"
                      >
                        {product.name}
                      </Link>

                      <div className="mt-3 flex flex-wrap items-end gap-2">
                        <span className="text-lg font-extrabold text-[#df6f91] sm:text-xl">
                          ฿{formatPrice(currentPrice)}
                        </span>

                        {promotionActive && (
                          <span className="pb-0.5 text-xs text-gray-400 line-through">
                            ฿{formatPrice(product.regularPrice)}
                          </span>
                        )}
                      </div>

                      <button
                        type="button"
                        onClick={() => addToCart(product)}
                        className={`mt-auto w-full rounded-2xl px-3 py-2.5 text-xs font-bold transition sm:text-sm ${
                          inCart
                            ? "bg-[#fff1f5] text-[#d65f84] hover:bg-[#ffe7ef]"
                            : "bg-[#df6f91] text-white hover:bg-[#d35d82]"
                        }`}
                      >
                        {inCart ? "เพิ่มอีก 1 ชิ้น" : "เพิ่มลงตะกร้า"}
                      </button>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </div>
      </section>

      <footer className="border-t border-[#f3dce4] bg-[#fff1f5] px-4 py-9 text-center">
        <img
          src="/images/logo-icon.png"
          alt="queenb.sticker"
          className="mx-auto h-14 w-14 rounded-2xl object-contain shadow-sm"
        />
        <p className="mt-3 text-sm font-bold text-[#df6f91]">
          queenb.sticker
        </p>
        <p className="mt-1 text-xs text-[#9b838b]">
          © 2026 queenb.sticker · Cute stickers & LINE themes
        </p>
      </footer>

      {cartOpen && (
        <div className="fixed inset-0 z-50">
          <button
            type="button"
            aria-label="ปิดตะกร้า"
            onClick={() => setCartOpen(false)}
            className="absolute inset-0 bg-[#4f4144]/30 backdrop-blur-[2px]"
          />

          <aside className="absolute right-0 top-0 flex h-full w-full max-w-md flex-col bg-[#fff9f5] shadow-2xl">
            <div className="flex items-center justify-between border-b border-[#f0d8e0] px-5 py-4">
              <div>
                <p className="text-lg font-bold text-[#4f4144]">ตะกร้าสินค้า</p>
                <p className="text-xs text-[#8d777e]">{cartCount} ชิ้น</p>
              </div>

              <button
                type="button"
                onClick={() => setCartOpen(false)}
                className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-xl text-[#806d72] shadow-sm"
              >
                ×
              </button>
            </div>

            <div className="flex-1 space-y-3 overflow-y-auto p-4">
              {cart.length === 0 ? (
                <div className="rounded-[26px] border border-[#f0d8e0] bg-white px-5 py-12 text-center">
                  <p className="text-lg font-bold">ตะกร้ายังว่างอยู่</p>
                  <p className="mt-2 text-sm text-[#806d72]">
                    เลือกสินค้าน่ารัก ๆ เพิ่มลงตะกร้าได้เลยค่ะ
                  </p>
                </div>
              ) : (
                cart.map((item) => (
                  <article
                    key={item.id}
                    className="flex gap-3 rounded-[22px] border border-[#f0d8e0] bg-white p-3"
                  >
                    <img
                      src={item.image}
                      alt={item.name}
                      className="h-20 w-20 rounded-2xl object-cover"
                    />

                    <div className="min-w-0 flex-1">
                      <p className="line-clamp-2 text-sm font-bold leading-5">
                        {item.name}
                      </p>
                      <p className="mt-1 text-sm font-bold text-[#df6f91]">
                        ฿{formatPrice(getCurrentPrice(item))}
                      </p>

                      <div className="mt-2 flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => updateQuantity(item.id, -1)}
                          className="flex h-8 w-8 items-center justify-center rounded-full bg-[#fff1f5] font-bold text-[#d65f84]"
                        >
                          −
                        </button>

                        <span className="min-w-6 text-center text-sm font-bold">
                          {item.quantity}
                        </span>

                        <button
                          type="button"
                          onClick={() => updateQuantity(item.id, 1)}
                          className="flex h-8 w-8 items-center justify-center rounded-full bg-[#fff1f5] font-bold text-[#d65f84]"
                        >
                          +
                        </button>
                      </div>
                    </div>
                  </article>
                ))
              )}
            </div>

            <div className="border-t border-[#f0d8e0] bg-white p-5">
              <div className="flex items-center justify-between">
                <span className="text-sm text-[#806d72]">ยอดรวม</span>
                <span className="text-2xl font-extrabold text-[#df6f91]">
                  ฿{formatPrice(cartTotal)}
                </span>
              </div>

              <Link
                href="/"
                onClick={() => setCartOpen(false)}
                className={`mt-4 flex w-full items-center justify-center rounded-2xl px-4 py-3 text-sm font-bold ${
                  cart.length === 0
                    ? "pointer-events-none bg-gray-200 text-gray-400"
                    : "bg-[#df6f91] text-white hover:bg-[#d35d82]"
                }`}
              >
                ไปดำเนินการสั่งซื้อที่หน้าแรก
              </Link>
            </div>
          </aside>
        </div>
      )}
    </main>
  );
}
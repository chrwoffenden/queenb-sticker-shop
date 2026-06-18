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
  salePrice: number;
  promotionEnd: string;
  slug: string;
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
};

const PROMOTION_GROUP_URL =
  "https://line.me/ti/g2/xe-yDco3LOiVICuEyUTE-1sQR6wrwHZGipDXOQ?utm_source=invitation&utm_medium=link_copy&utm_campaign=default";

function formatPrice(price: number) {
  return new Intl.NumberFormat("th-TH").format(price);
}

function formatDate(date: string) {
  return new Intl.DateTimeFormat("th-TH", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(`${date}T00:00:00`));
}

function isPromotionActive(product: Product) {
  const end = new Date(`${product.promotionEnd}T23:59:59`);
  return new Date() <= end;
}

function daysLeft(date: string) {
  const now = new Date();
  const end = new Date(`${date}T23:59:59`);
  const difference = end.getTime() - now.getTime();

  return Math.max(0, Math.ceil(difference / (1000 * 60 * 60 * 24)));
}

export default function PromotionsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    const loadPromotions = async () => {
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
            slug
          `,
        )
        .eq("is_active", true)
        .not("sale_price", "is", null)
        .not("promotion_end", "is", null)
        .order("promotion_end", { ascending: true });

      if (error) {
        console.error("โหลดโปรโมชั่นไม่สำเร็จ", error);
        setErrorMessage("ไม่สามารถโหลดโปรโมชั่นได้ กรุณาลองใหม่อีกครั้ง");
        setLoading(false);
        return;
      }

      const formatted = ((data ?? []) as SupabaseProduct[])
        .filter(
          (product) =>
            product.sale_price !== null &&
            product.promotion_end !== null,
        )
        .map((product) => ({
          id: product.id,
          name: product.name,
          category: product.category,
          image: product.image,
          regularPrice: Number(product.regular_price),
          salePrice: Number(product.sale_price),
          promotionEnd: product.promotion_end as string,
          slug: product.slug,
        }))
        .filter(isPromotionActive);

      setProducts(formatted);
      setLoading(false);
    };

    loadPromotions();
  }, []);

  const urgentPromotions = useMemo(
    () => products.filter((product) => daysLeft(product.promotionEnd) <= 3),
    [products],
  );

  return (
    <main className="min-h-screen bg-[#fff9f5] text-[#4f4144]">
      <header className="sticky top-0 z-30 border-b border-[#f4dfe6] bg-[#fff9f5]/95 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
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

          <Link
            href="/"
            className="rounded-full border border-[#e7cbd4] bg-white px-4 py-2 text-sm font-semibold text-[#7d666e] transition hover:bg-[#fff4f7]"
          >
            กลับหน้าร้าน
          </Link>
        </div>
      </header>

      <section className="px-4 pb-10 pt-8 sm:px-6 sm:pt-12">
        <div className="mx-auto max-w-6xl overflow-hidden rounded-[36px] border border-[#f1dbe3] bg-gradient-to-br from-[#fff0f5] via-white to-[#fff7dc] px-6 py-10 text-center shadow-[0_18px_50px_rgba(179,108,133,0.10)] sm:px-10 sm:py-14">
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-[28px] bg-white shadow-sm">
            <img
              src="/images/logo-icon.png"
              alt="queenb.sticker"
              className="h-16 w-16 rounded-2xl object-contain"
            />
          </div>

          <p className="mt-5 text-sm font-bold uppercase tracking-[0.22em] text-[#d46b8d]">
            Special Promotion
          </p>

          <h1 className="mt-2 text-3xl font-bold text-[#4f4144] sm:text-5xl">
            โปรโมชั่นน่ารัก ราคาพิเศษ
          </h1>

          <p className="mx-auto mt-4 max-w-2xl text-sm leading-7 text-[#806d72] sm:text-base">
            รวมสติกเกอร์และธีม LINE ที่กำลังลดราคา
            โปรจะแสดงเฉพาะรายการที่ยังไม่หมดเขตเท่านั้น
          </p>

          <a
            href={PROMOTION_GROUP_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-7 inline-flex rounded-full bg-[#06c755] px-6 py-3 text-sm font-bold text-white transition hover:bg-[#05b84e]"
          >
            เข้ากลุ่มแจ้งโปร
          </a>
        </div>
      </section>

      {urgentPromotions.length > 0 && (
        <section className="px-4 pb-8 sm:px-6">
          <div className="mx-auto max-w-6xl rounded-[28px] border border-[#f4cfd9] bg-[#fff2f5] px-5 py-5 sm:px-7">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm font-bold text-[#d85f82]">
                  โปรใกล้หมดแล้ว
                </p>
                <p className="mt-1 text-sm text-[#806d72]">
                  มี {urgentPromotions.length} รายการที่เหลือเวลาไม่เกิน 3 วัน
                </p>
              </div>

              <span className="w-fit rounded-full bg-white px-4 py-2 text-xs font-bold text-[#d85f82] shadow-sm">
                รีบเลือกก่อนหมดโปร
              </span>
            </div>
          </div>
        </section>
      )}

      <section className="px-4 pb-16 sm:px-6">
        <div className="mx-auto max-w-6xl">
          <div className="mb-6 flex items-end justify-between gap-4">
            <div>
              <p className="text-sm font-semibold text-[#d46b8d]">
                Promotion Items
              </p>
              <h2 className="mt-1 text-2xl font-bold text-[#4f4144]">
                สินค้าที่กำลังลดราคา
              </h2>
            </div>

            {!loading && (
              <span className="rounded-full bg-white px-4 py-2 text-xs font-semibold text-[#806d72] shadow-sm">
                {products.length} รายการ
              </span>
            )}
          </div>

          {loading ? (
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {[1, 2, 3, 4, 5, 6].map((item) => (
                <div
                  key={item}
                  className="aspect-[4/5] animate-pulse rounded-[28px] bg-white shadow-sm"
                />
              ))}
            </div>
          ) : errorMessage ? (
            <div className="rounded-[28px] border border-[#f1dbe3] bg-white px-6 py-12 text-center">
              <p className="font-semibold text-[#d35f82]">{errorMessage}</p>
            </div>
          ) : products.length === 0 ? (
            <div className="rounded-[28px] border border-[#f1dbe3] bg-white px-6 py-14 text-center shadow-sm">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#fff1f5] text-2xl">
                ♡
              </div>
              <h3 className="mt-4 text-xl font-bold text-[#4f4144]">
                ตอนนี้ยังไม่มีโปรโมชั่น
              </h3>
              <p className="mt-2 text-sm leading-7 text-[#806d72]">
                ติดตามกลุ่มแจ้งโปรเพื่อรับข่าวโปรโมชั่นรอบถัดไป
              </p>
            </div>
          ) : (
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {products.map((product) => {
                const remainingDays = daysLeft(product.promotionEnd);
                const discountPercent = Math.round(
                  ((product.regularPrice - product.salePrice) /
                    product.regularPrice) *
                    100,
                );

                return (
                  <article
                    key={product.id}
                    className="group overflow-hidden rounded-[28px] border border-[#f0d8e0] bg-white shadow-[0_10px_30px_rgba(159,95,117,0.08)] transition hover:-translate-y-1 hover:shadow-[0_16px_36px_rgba(159,95,117,0.13)]"
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

                      <div className="absolute left-3 top-3 flex flex-col gap-2">
                        <span className="w-fit rounded-full bg-[#df6f91] px-3 py-1.5 text-xs font-bold text-white shadow-sm">
                          ลด {discountPercent}%
                        </span>

                        {remainingDays <= 3 && (
                          <span className="w-fit rounded-full bg-[#fff4d4] px-3 py-1.5 text-xs font-bold text-[#a87510] shadow-sm">
                            เหลือ {remainingDays} วัน
                          </span>
                        )}
                      </div>
                    </Link>

                    <div className="p-5">
                      <p className="text-xs font-semibold text-[#d46b8d]">
                        {product.category === "Sticker"
                          ? "LINE Sticker"
                          : "LINE Theme"}
                      </p>

                      <Link
                        href={`/product/${product.slug}`}
                        className="mt-1 block text-lg font-bold leading-7 text-[#4f4144] transition hover:text-[#d65f84]"
                      >
                        {product.name}
                      </Link>

                      <div className="mt-4 flex flex-wrap items-end gap-2">
                        <span className="text-2xl font-bold text-[#df6f91]">
                          ฿{formatPrice(product.salePrice)}
                        </span>
                        <span className="pb-1 text-sm text-gray-400 line-through">
                          ฿{formatPrice(product.regularPrice)}
                        </span>
                      </div>

                      <p className="mt-2 text-xs text-[#8d777e]">
                        หมดโปรโมชั่น {formatDate(product.promotionEnd)}
                      </p>

                      <Link
                        href={`/product/${product.slug}`}
                        className="mt-5 flex w-full items-center justify-center rounded-2xl bg-[#df6f91] px-4 py-3 text-sm font-bold text-white transition hover:bg-[#d35d82]"
                      >
                        ดูรายละเอียดสินค้า
                      </Link>
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
    </main>
  );
}

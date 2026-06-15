"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

type ProductRow = {
  id: number;
  name: string;
  slug: string;
  category: "Sticker" | "Theme";
  image: string;
  preview_images: string[] | null;
  regular_price: number | string;
  sale_price: number | string | null;
  promotion_end: string | null;
  line_store_url: string | null;
  is_best_seller: boolean;
  is_active: boolean;
};

type CategoryFilter = "all" | "Sticker" | "Theme";
type StatusFilter = "all" | "active" | "hidden";
type BestSellerFilter = "all" | "best-seller";
type PromotionFilter = "all" | "active" | "none" | "expired";
type SortOption =
  | "newest"
  | "oldest"
  | "price-low"
  | "price-high"
  | "name-az"
  | "name-za";

function formatPrice(price: number | string) {
  return new Intl.NumberFormat("th-TH").format(
    Number(price),
  );
}

function formatDate(date: string | null) {
  if (!date) return "-";

  return new Intl.DateTimeFormat("th-TH", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(`${date}T00:00:00`));
}

export default function AdminProductsPage() {
  const router = useRouter();

  const [products, setProducts] = useState<ProductRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [updatingProductId, setUpdatingProductId] =
    useState<number | null>(null);
  const [updatingBestSellerId, setUpdatingBestSellerId] =
    useState<number | null>(null);
  const [duplicatingProductId, setDuplicatingProductId] =
    useState<number | null>(null);

  const [searchText, setSearchText] = useState("");
  const [categoryFilter, setCategoryFilter] =
    useState<CategoryFilter>("all");
  const [statusFilter, setStatusFilter] =
    useState<StatusFilter>("all");
  const [bestSellerFilter, setBestSellerFilter] =
    useState<BestSellerFilter>("all");
  const [promotionFilter, setPromotionFilter] =
    useState<PromotionFilter>("all");
  const [sortOption, setSortOption] =
    useState<SortOption>("newest");

  const loadProducts = useCallback(async () => {
    setLoading(true);
    setMessage("");

    const { data, error } = await supabase
      .from("products")
      .select(
        `
          id,
          name,
          slug,
          category,
          image,
          preview_images,
          regular_price,
          sale_price,
          promotion_end,
          line_store_url,
          is_best_seller,
          is_active
        `,
      )
      .order("id", { ascending: false });

    if (error) {
      console.error("โหลดสินค้าไม่สำเร็จ", error);
      setMessage("ไม่สามารถโหลดสินค้าได้");
      setLoading(false);
      return;
    }

    setProducts((data ?? []) as ProductRow[]);
    setLoading(false);
  }, []);

  useEffect(() => {
    const initializePage = async () => {
      const {
        data: { user },
        error,
      } = await supabase.auth.getUser();

      if (error || !user) {
        router.replace("/admin/login");
        return;
      }

      await loadProducts();
    };

    initializePage();
  }, [loadProducts, router]);

  const handleDuplicateProduct = async (
    product: ProductRow,
  ) => {
    const confirmed = window.confirm(
      `ต้องการคัดลอกสินค้า "${product.name}" ใช่ไหม?`,
    );

    if (!confirmed) return;

    setDuplicatingProductId(product.id);
    setMessage("");

    const duplicateSlug = `${product.slug}-copy-${Date.now()}`;
    const duplicateName = `${product.name} (สำเนา)`;

    const { data, error } = await supabase
      .from("products")
      .insert({
        name: duplicateName,
        slug: duplicateSlug,
        category: product.category,
        image: product.image,
        preview_images: product.preview_images ?? [],
        regular_price: Number(product.regular_price),
        sale_price:
          product.sale_price !== null
            ? Number(product.sale_price)
            : null,
        promotion_end: product.promotion_end,
        line_store_url: product.line_store_url,
        is_best_seller: false,
        is_active: false,
        updated_at: new Date().toISOString(),
      })
      .select("id")
      .single();

    if (error || !data) {
      console.error("คัดลอกสินค้าไม่สำเร็จ", error);
      setMessage("ไม่สามารถคัดลอกสินค้าได้");
      setDuplicatingProductId(null);
      return;
    }

    setDuplicatingProductId(null);

    router.push(
      `/admin/products/${data.id}/edit`,
    );
  };

  const handleToggleBestSeller = async (
    product: ProductRow,
  ) => {
    setUpdatingBestSellerId(product.id);
    setMessage("");

    const nextBestSellerStatus =
      !product.is_best_seller;

    const { error } = await supabase
      .from("products")
      .update({
        is_best_seller: nextBestSellerStatus,
        updated_at: new Date().toISOString(),
      })
      .eq("id", product.id);

    if (error) {
      console.error(
        "เปลี่ยนสถานะ Best Seller ไม่สำเร็จ",
        error,
      );
      setMessage(
        "ไม่สามารถเปลี่ยนสถานะ Best Seller ได้",
      );
      setUpdatingBestSellerId(null);
      return;
    }

    setProducts((currentProducts) =>
      currentProducts.map((currentProduct) =>
        currentProduct.id === product.id
          ? {
              ...currentProduct,
              is_best_seller:
                nextBestSellerStatus,
            }
          : currentProduct,
      ),
    );

    setUpdatingBestSellerId(null);
  };

  const handleToggleProductStatus = async (
    product: ProductRow,
  ) => {
    setUpdatingProductId(product.id);
    setMessage("");

    const nextStatus = !product.is_active;

    const { error } = await supabase
      .from("products")
      .update({
        is_active: nextStatus,
        updated_at: new Date().toISOString(),
      })
      .eq("id", product.id);

    if (error) {
      console.error("เปลี่ยนสถานะสินค้าไม่สำเร็จ", error);
      setMessage("ไม่สามารถเปลี่ยนสถานะสินค้าได้");
      setUpdatingProductId(null);
      return;
    }

    setProducts((currentProducts) =>
      currentProducts.map((currentProduct) =>
        currentProduct.id === product.id
          ? {
              ...currentProduct,
              is_active: nextStatus,
            }
          : currentProduct,
      ),
    );

    setUpdatingProductId(null);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.replace("/admin/login");
    router.refresh();
  };

  const filteredProducts = products.filter((product) => {
    const matchesSearch = product.name
      .toLowerCase()
      .includes(searchText.trim().toLowerCase());

    const matchesCategory =
      categoryFilter === "all" ||
      product.category === categoryFilter;

    const matchesStatus =
      statusFilter === "all" ||
      (statusFilter === "active" && product.is_active) ||
      (statusFilter === "hidden" && !product.is_active);

    const matchesBestSeller =
      bestSellerFilter === "all" ||
      product.is_best_seller;

    const now = new Date();
    const promotionEnd = product.promotion_end
      ? new Date(`${product.promotion_end}T23:59:59`)
      : null;

    const hasPromotion =
      product.sale_price !== null &&
      product.promotion_end !== null;

    const promotionIsActive =
      hasPromotion &&
      promotionEnd !== null &&
      promotionEnd >= now;

    const promotionIsExpired =
      hasPromotion &&
      promotionEnd !== null &&
      promotionEnd < now;

    const matchesPromotion =
      promotionFilter === "all" ||
      (promotionFilter === "active" &&
        promotionIsActive) ||
      (promotionFilter === "none" &&
        !hasPromotion) ||
      (promotionFilter === "expired" &&
        promotionIsExpired);

    return (
      matchesSearch &&
      matchesCategory &&
      matchesStatus &&
      matchesBestSeller &&
      matchesPromotion
    );
  });

  const sortedProducts = [...filteredProducts].sort(
    (productA, productB) => {
      const activePriceA =
        productA.sale_price !== null
          ? Number(productA.sale_price)
          : Number(productA.regular_price);

      const activePriceB =
        productB.sale_price !== null
          ? Number(productB.sale_price)
          : Number(productB.regular_price);

      switch (sortOption) {
        case "oldest":
          return productA.id - productB.id;

        case "price-low":
          return activePriceA - activePriceB;

        case "price-high":
          return activePriceB - activePriceA;

        case "name-az":
          return productA.name.localeCompare(
            productB.name,
            "th",
          );

        case "name-za":
          return productB.name.localeCompare(
            productA.name,
            "th",
          );

        case "newest":
        default:
          return productB.id - productA.id;
      }
    },
  );

  const clearFilters = () => {
    setSearchText("");
    setCategoryFilter("all");
    setStatusFilter("all");
    setBestSellerFilter("all");
    setPromotionFilter("all");
    setSortOption("newest");
  };

  const hasActiveFilters =
    searchText.trim() !== "" ||
    categoryFilter !== "all" ||
    statusFilter !== "all" ||
    bestSellerFilter !== "all" ||
    promotionFilter !== "all" ||
    sortOption !== "newest";

  const totalProducts = products.length;

  const activeProducts = products.filter(
    (product) => product.is_active,
  ).length;

  const hiddenProducts = products.filter(
    (product) => !product.is_active,
  ).length;

  const bestSellerProducts = products.filter(
    (product) => product.is_best_seller,
  ).length;

  const activePromotionProducts = products.filter(
    (product) => {
      if (
        product.sale_price === null ||
        product.promotion_end === null
      ) {
        return false;
      }

      const promotionEnd = new Date(
        `${product.promotion_end}T23:59:59`,
      );

      return promotionEnd >= new Date();
    },
  ).length;

  return (
    <main className="min-h-screen bg-[#fff8f5]">
      <header className="border-b border-pink-100 bg-white">
        <div className="mx-auto flex max-w-6xl flex-col gap-4 px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-semibold text-[#df6f91]">
              queenb.sticker
            </p>

            <h1 className="text-xl font-bold text-[#4f4144]">
              จัดการสินค้า
            </h1>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => router.push("/")}
              className="rounded-2xl border border-pink-200 bg-white px-4 py-2 text-sm font-semibold text-[#d65f84] transition hover:bg-pink-50"
            >
              🏠 ดูหน้าร้าน
            </button>

            <button
              type="button"
              onClick={handleLogout}
              className="rounded-2xl border border-gray-200 px-4 py-2 text-sm font-medium text-gray-600 transition hover:bg-gray-50"
            >
              ออกจากระบบ
            </button>
          </div>
        </div>
      </header>

      <section className="mx-auto max-w-6xl px-4 py-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm text-gray-500">
              สินค้าทั้งหมดในร้าน
            </p>

            <h2 className="mt-1 text-2xl font-bold text-[#4f4144]">
              {sortedProducts.length} จาก {products.length} รายการ
            </h2>
          </div>

          <button
            type="button"
            onClick={() =>
              router.push("/admin/products/new")
            }
            className="rounded-2xl bg-[#df6f91] px-5 py-3 font-semibold text-white transition hover:bg-[#d35d82]"
          >
            + เพิ่มสินค้าใหม่
          </button>
        </div>

        <section className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          <article className="rounded-[24px] border border-pink-100 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-2xl">📦</span>
              <span className="rounded-full bg-pink-50 px-3 py-1 text-xs font-semibold text-[#d76588]">
                ทั้งหมด
              </span>
            </div>

            <p className="mt-5 text-3xl font-bold text-[#4f4144]">
              {totalProducts}
            </p>

            <p className="mt-1 text-sm text-gray-500">
              สินค้าทั้งหมด
            </p>
          </article>

          <article className="rounded-[24px] border border-green-100 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-2xl">✅</span>
              <span className="rounded-full bg-green-50 px-3 py-1 text-xs font-semibold text-green-700">
                กำลังแสดง
              </span>
            </div>

            <p className="mt-5 text-3xl font-bold text-[#4f4144]">
              {activeProducts}
            </p>

            <p className="mt-1 text-sm text-gray-500">
              ลูกค้ามองเห็น
            </p>
          </article>

          <article className="rounded-[24px] border border-gray-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-2xl">🙈</span>
              <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-semibold text-gray-600">
                ซ่อนอยู่
              </span>
            </div>

            <p className="mt-5 text-3xl font-bold text-[#4f4144]">
              {hiddenProducts}
            </p>

            <p className="mt-1 text-sm text-gray-500">
              ยังไม่แสดงหน้าร้าน
            </p>
          </article>

          <article className="rounded-[24px] border border-amber-100 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-2xl">🔥</span>
              <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-700">
                Best Seller
              </span>
            </div>

            <p className="mt-5 text-3xl font-bold text-[#4f4144]">
              {bestSellerProducts}
            </p>

            <p className="mt-1 text-sm text-gray-500">
              สินค้าขายดี
            </p>
          </article>

          <article className="rounded-[24px] border border-rose-100 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-2xl">🎀</span>
              <span className="rounded-full bg-rose-50 px-3 py-1 text-xs font-semibold text-rose-700">
                โปรโมชั่น
              </span>
            </div>

            <p className="mt-5 text-3xl font-bold text-[#4f4144]">
              {activePromotionProducts}
            </p>

            <p className="mt-1 text-sm text-gray-500">
              กำลังลดราคา
            </p>
          </article>
        </section>

        <section className="mt-8 rounded-[28px] border border-pink-100 bg-white p-5 shadow-sm">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-6">
            <div className="lg:col-span-2">
              <label
                htmlFor="product-search"
                className="text-sm font-semibold text-[#5c4a50]"
              >
                ค้นหาสินค้า
              </label>

              <input
                id="product-search"
                type="search"
                value={searchText}
                onChange={(event) =>
                  setSearchText(event.target.value)
                }
                placeholder="พิมพ์ชื่อสินค้า..."
                className="mt-2 w-full rounded-2xl border border-pink-100 px-4 py-3 outline-none transition focus:border-[#df7796] focus:ring-2 focus:ring-pink-100"
              />
            </div>

            <div>
              <label
                htmlFor="category-filter"
                className="text-sm font-semibold text-[#5c4a50]"
              >
                ประเภทสินค้า
              </label>

              <select
                id="category-filter"
                value={categoryFilter}
                onChange={(event) =>
                  setCategoryFilter(
                    event.target.value as CategoryFilter,
                  )
                }
                className="mt-2 w-full rounded-2xl border border-pink-100 bg-white px-4 py-3 outline-none"
              >
                <option value="all">ทุกประเภท</option>
                <option value="Sticker">LINE Sticker</option>
                <option value="Theme">LINE Theme</option>
              </select>
            </div>

            <div>
              <label
                htmlFor="status-filter"
                className="text-sm font-semibold text-[#5c4a50]"
              >
                สถานะสินค้า
              </label>

              <select
                id="status-filter"
                value={statusFilter}
                onChange={(event) =>
                  setStatusFilter(
                    event.target.value as StatusFilter,
                  )
                }
                className="mt-2 w-full rounded-2xl border border-pink-100 bg-white px-4 py-3 outline-none"
              >
                <option value="all">ทุกสถานะ</option>
                <option value="active">กำลังแสดง</option>
                <option value="hidden">ซ่อนสินค้า</option>
              </select>
            </div>

            <div>
              <label
                htmlFor="promotion-filter"
                className="text-sm font-semibold text-[#5c4a50]"
              >
                โปรโมชั่น
              </label>

              <select
                id="promotion-filter"
                value={promotionFilter}
                onChange={(event) =>
                  setPromotionFilter(
                    event.target.value as PromotionFilter,
                  )
                }
                className="mt-2 w-full rounded-2xl border border-pink-100 bg-white px-4 py-3 outline-none"
              >
                <option value="all">ทุกโปรโมชั่น</option>
                <option value="active">กำลังลดราคา</option>
                <option value="none">ไม่มีโปรโมชั่น</option>
                <option value="expired">โปรหมดแล้ว</option>
              </select>
            </div>

            <div>
              <label
                htmlFor="sort-option"
                className="text-sm font-semibold text-[#5c4a50]"
              >
                เรียงลำดับ
              </label>

              <select
                id="sort-option"
                value={sortOption}
                onChange={(event) =>
                  setSortOption(
                    event.target.value as SortOption,
                  )
                }
                className="mt-2 w-full rounded-2xl border border-pink-100 bg-white px-4 py-3 outline-none"
              >
                <option value="newest">ใหม่สุดก่อน</option>
                <option value="oldest">เก่าสุดก่อน</option>
                <option value="price-low">ราคาต่ำไปสูง</option>
                <option value="price-high">ราคาสูงไปต่ำ</option>
                <option value="name-az">ชื่อ A–Z</option>
                <option value="name-za">ชื่อ Z–A</option>
              </select>
            </div>
          </div>

          <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <label className="flex cursor-pointer items-center gap-3 rounded-2xl bg-[#fff8fa] px-4 py-3">
              <input
                type="checkbox"
                checked={bestSellerFilter === "best-seller"}
                onChange={(event) =>
                  setBestSellerFilter(
                    event.target.checked
                      ? "best-seller"
                      : "all",
                  )
                }
                className="h-5 w-5 accent-[#df6f91]"
              />

              <span className="text-sm font-semibold text-[#5c4a50]">
                แสดงเฉพาะ Best Seller
              </span>
            </label>

            {hasActiveFilters && (
              <button
                type="button"
                onClick={clearFilters}
                className="rounded-2xl border border-gray-200 px-4 py-2.5 text-sm font-medium text-gray-600 transition hover:bg-gray-50"
              >
                ล้างตัวกรอง
              </button>
            )}
          </div>
        </section>

        {message && (
          <div className="mt-6 rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-600">
            {message}
          </div>
        )}

        {loading ? (
          <div className="mt-8 rounded-3xl bg-white p-10 text-center text-sm text-gray-500 shadow-sm">
            กำลังโหลดสินค้า...
          </div>
        ) : products.length === 0 ? (
          <div className="mt-8 rounded-3xl bg-white p-10 text-center shadow-sm">
            <p className="text-gray-500">
              ยังไม่มีสินค้าในระบบ
            </p>
          </div>
        ) : sortedProducts.length === 0 ? (
          <div className="mt-8 rounded-3xl bg-white p-10 text-center shadow-sm">
            <p className="font-semibold text-[#4f4144]">
              ไม่พบสินค้าที่ตรงกับตัวกรอง
            </p>

            <p className="mt-2 text-sm text-gray-500">
              ลองเปลี่ยนคำค้นหาหรือล้างตัวกรอง
            </p>

            <button
              type="button"
              onClick={clearFilters}
              className="mt-5 rounded-2xl border border-pink-200 px-4 py-2.5 text-sm font-semibold text-[#d65f84] transition hover:bg-pink-50"
            >
              ล้างตัวกรอง
            </button>
          </div>
        ) : (
          <div className="mt-8 grid gap-4">
            {sortedProducts.map((product) => {
              const hasPromotion =
                product.sale_price !== null;

              return (
                <article
                  key={product.id}
                  className="flex flex-col gap-4 rounded-3xl border border-pink-100 bg-white p-4 shadow-sm sm:flex-row sm:items-start"
                >
                  <img
                    src={product.image}
                    alt={product.name}
                    className="aspect-square w-full rounded-2xl bg-pink-50 object-cover sm:h-24 sm:w-24"
                  />

                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap gap-2">
                      <span className="rounded-full bg-pink-50 px-3 py-1 text-xs font-semibold text-[#d76588]">
                        {product.category === "Sticker"
                          ? "LINE Sticker"
                          : "LINE Theme"}
                      </span>

                      {product.is_best_seller && (
                        <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-700">
                          🔥 Best Seller
                        </span>
                      )}

                      <span
                        className={`rounded-full px-3 py-1 text-xs font-semibold ${
                          product.is_active
                            ? "bg-green-50 text-green-700"
                            : "bg-gray-100 text-gray-500"
                        }`}
                      >
                        {product.is_active
                          ? "กำลังแสดง"
                          : "ซ่อนสินค้า"}
                      </span>
                    </div>

                    <h3 className="mt-3 truncate text-lg font-bold text-[#4f4144]">
                      {product.name}
                    </h3>

                    <div className="mt-2 flex flex-wrap items-center gap-2">
                      {hasPromotion ? (
                        <>
                          <span className="font-bold text-[#df6388]">
                            ฿
                            {formatPrice(
                              product.sale_price!,
                            )}
                          </span>

                          <span className="text-sm text-gray-400 line-through">
                            ฿
                            {formatPrice(
                              product.regular_price,
                            )}
                          </span>
                        </>
                      ) : (
                        <span className="font-bold text-[#df6388]">
                          ฿
                          {formatPrice(
                            product.regular_price,
                          )}
                        </span>
                      )}
                    </div>

                    {hasPromotion && (
                      <p className="mt-1 text-xs text-gray-500">
                        หมดโปรโมชั่น{" "}
                        {formatDate(
                          product.promotion_end,
                        )}
                      </p>
                    )}
                  </div>

                  <div className="w-full sm:w-[240px]">
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() =>
                          handleDuplicateProduct(product)
                        }
                        disabled={
                          duplicatingProductId === product.id
                        }
                        className={`rounded-2xl border border-violet-200 bg-violet-50 px-3 py-2.5 text-sm font-semibold text-violet-700 transition hover:bg-violet-100 ${
                          duplicatingProductId === product.id
                            ? "cursor-wait opacity-60"
                            : ""
                        }`}
                      >
                        {duplicatingProductId ===
                        product.id
                          ? "กำลังคัดลอก..."
                          : "คัดลอก"}
                      </button>

                      <button
                        type="button"
                        onClick={() =>
                          handleToggleProductStatus(product)
                        }
                        disabled={
                          updatingProductId === product.id
                        }
                        className={`rounded-2xl px-3 py-2.5 text-sm font-semibold transition ${
                          product.is_active
                            ? "border border-gray-200 bg-white text-gray-600 hover:bg-gray-50"
                            : "bg-[#df6f91] text-white hover:bg-[#d35d82]"
                        } ${
                          updatingProductId === product.id
                            ? "cursor-wait opacity-60"
                            : ""
                        }`}
                      >
                        {updatingProductId ===
                        product.id
                          ? "กำลังบันทึก..."
                          : product.is_active
                            ? "ซ่อนสินค้า"
                            : "แสดงสินค้า"}
                      </button>

                      <button
                        type="button"
                        onClick={() =>
                          handleToggleBestSeller(product)
                        }
                        disabled={
                          updatingBestSellerId ===
                          product.id
                        }
                        className={`rounded-2xl px-3 py-2.5 text-sm font-semibold transition ${
                          product.is_best_seller
                            ? "border border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-100"
                            : "border border-gray-200 bg-white text-gray-600 hover:bg-gray-50"
                        } ${
                          updatingBestSellerId ===
                          product.id
                            ? "cursor-wait opacity-60"
                            : ""
                        }`}
                      >
                        {updatingBestSellerId ===
                        product.id
                          ? "กำลังบันทึก..."
                          : product.is_best_seller
                            ? "เลิกขายดี"
                            : "ตั้งขายดี"}
                      </button>

                      {product.line_store_url ? (
                        <a
                          href={product.line_store_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="rounded-2xl bg-[#06c755] px-3 py-2.5 text-center text-sm font-semibold text-white transition hover:bg-[#05b84e]"
                        >
                          LINE Store
                        </a>
                      ) : (
                        <button
                          type="button"
                          disabled
                          title="สินค้านี้ยังไม่มีลิงก์ LINE Store"
                          className="cursor-not-allowed rounded-2xl bg-gray-100 px-3 py-2.5 text-sm font-semibold text-gray-400"
                        >
                          ไม่มีลิงก์
                        </button>
                      )}
                    </div>

                    <button
                      type="button"
                      onClick={() =>
                        router.push(
                          `/admin/products/${product.id}/edit`,
                        )
                      }
                      className="mt-2 w-full rounded-2xl border border-pink-200 px-4 py-3 text-sm font-semibold text-[#d65f84] transition hover:bg-pink-50"
                    >
                      แก้ไขสินค้า
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>
    </main>
  );
}
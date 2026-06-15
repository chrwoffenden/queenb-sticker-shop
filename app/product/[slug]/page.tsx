"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

type Product = {
  id: number;
  name: string;
  category: "Sticker" | "Theme";
  image: string;
  previewImages: string[];
  regularPrice: number;
  salePrice?: number;
  promotionEnd?: string;
  slug: string;
  lineStoreUrl?: string;
  isBestSeller: boolean;
};

type SupabaseProduct = {
  id: number;
  name: string;
  category: "Sticker" | "Theme";
  image: string;
  preview_images: string[] | null;
  regular_price: number | string;
  sale_price: number | string | null;
  promotion_end: string | null;
  slug: string;
  line_store_url: string | null;
  is_best_seller: boolean;
};

type CartItem = Product & {
  quantity: number;
};

const CART_STORAGE_KEY = "queenb-cart";

function formatPrice(price: number) {
  return new Intl.NumberFormat("th-TH").format(price);
}

function formatDate(date?: string) {
  if (!date) return "";

  return new Intl.DateTimeFormat("th-TH", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(`${date}T00:00:00`));
}

function isPromotionActive(product: Product) {
  if (
    product.salePrice === undefined ||
    !product.promotionEnd
  ) {
    return false;
  }

  const promotionEnd = new Date(
    `${product.promotionEnd}T23:59:59`,
  );

  return new Date() <= promotionEnd;
}

function getCurrentPrice(product: Product) {
  if (
    isPromotionActive(product) &&
    product.salePrice !== undefined
  ) {
    return product.salePrice;
  }

  return product.regularPrice;
}

export default function ProductDetailPage() {
  const params = useParams<{ slug: string }>();
  const router = useRouter();

  const slug = params?.slug;

  const [product, setProduct] =
    useState<Product | null>(null);

  const [selectedPreviewImage, setSelectedPreviewImage] =
    useState("");

  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  const [cart, setCart] = useState<CartItem[]>([]);
  const [cartLoaded, setCartLoaded] = useState(false);
  const [addedMessage, setAddedMessage] = useState("");

  useEffect(() => {
    const loadProduct = async () => {
      if (!slug) return;

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
            preview_images,
            regular_price,
            sale_price,
            promotion_end,
            slug,
            line_store_url,
            is_best_seller
          `,
        )
        .eq("slug", slug)
        .eq("is_active", true)
        .maybeSingle();

      if (error) {
        console.error("โหลดสินค้าไม่สำเร็จ", error);
        setErrorMessage(
          "ไม่สามารถโหลดรายละเอียดสินค้าได้",
        );
        setLoading(false);
        return;
      }

      if (!data) {
        setErrorMessage(
          "ไม่พบสินค้านี้ หรือสินค้าถูกซ่อนจากหน้าร้าน",
        );
        setLoading(false);
        return;
      }

      const productData = data as SupabaseProduct;

      const formattedProduct: Product = {
        id: productData.id,
        name: productData.name,
        category: productData.category,
        image: productData.image,
        previewImages:
          productData.preview_images &&
          productData.preview_images.length > 0
            ? productData.preview_images
            : [productData.image],
        regularPrice: Number(
          productData.regular_price,
        ),
        salePrice:
          productData.sale_price === null
            ? undefined
            : Number(productData.sale_price),
        promotionEnd:
          productData.promotion_end ?? undefined,
        slug: productData.slug,
        lineStoreUrl:
          productData.line_store_url ?? undefined,
        isBestSeller:
          productData.is_best_seller,
      };

      setProduct(formattedProduct);
      setSelectedPreviewImage(
        formattedProduct.previewImages[0] ||
          formattedProduct.image,
      );
      setLoading(false);
    };

    loadProduct();
  }, [slug]);

  useEffect(() => {
    try {
      const savedCart = localStorage.getItem(
        CART_STORAGE_KEY,
      );

      if (savedCart) {
        const parsedCart = JSON.parse(
          savedCart,
        ) as CartItem[];

        if (Array.isArray(parsedCart)) {
          setCart(parsedCart);
        }
      }
    } catch (error) {
      console.error(
        "ไม่สามารถโหลดตะกร้าได้",
        error,
      );
      localStorage.removeItem(CART_STORAGE_KEY);
    } finally {
      setCartLoaded(true);
    }
  }, []);

  useEffect(() => {
    if (!cartLoaded) return;

    localStorage.setItem(
      CART_STORAGE_KEY,
      JSON.stringify(cart),
    );
  }, [cart, cartLoaded]);

  useEffect(() => {
    if (!cartLoaded || !product) return;

    setCart((currentCart) =>
      currentCart.map((cartItem) =>
        cartItem.id === product.id
          ? {
              ...product,
              quantity: cartItem.quantity,
            }
          : cartItem,
      ),
    );
  }, [cartLoaded, product]);

  const cartQuantity = useMemo(() => {
    if (!product) return 0;

    return (
      cart.find((item) => item.id === product.id)
        ?.quantity ?? 0
    );
  }, [cart, product]);

  const totalCartQuantity = useMemo(() => {
    return cart.reduce(
      (total, item) => total + item.quantity,
      0,
    );
  }, [cart]);

  const totalCartPrice = useMemo(() => {
    return cart.reduce((total, item) => {
      return (
        total +
        getCurrentPrice(item) * item.quantity
      );
    }, 0);
  }, [cart]);

  const addToCart = () => {
    if (!product) return;

    setCart((currentCart) => {
      const existingItem = currentCart.find(
        (item) => item.id === product.id,
      );

      if (existingItem) {
        return currentCart.map((item) =>
          item.id === product.id
            ? {
                ...item,
                quantity: item.quantity + 1,
              }
            : item,
        );
      }

      return [
        ...currentCart,
        {
          ...product,
          quantity: 1,
        },
      ];
    });

    setAddedMessage(
      "เพิ่มสินค้าลงตะกร้าเรียบร้อยแล้ว ✓",
    );

    window.setTimeout(() => {
      setAddedMessage("");
    }, 2500);
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-[#fff9f5] px-4 py-10">
        <div className="mx-auto max-w-5xl rounded-[32px] border border-pink-100 bg-white p-10 text-center text-sm text-gray-500 shadow-sm">
          กำลังโหลดรายละเอียดสินค้า...
        </div>
      </main>
    );
  }

  if (errorMessage || !product) {
    return (
      <main className="min-h-screen bg-[#fff9f5] px-4 py-10">
        <div className="mx-auto max-w-xl rounded-[32px] border border-pink-100 bg-white p-8 text-center shadow-sm">
          <div className="text-4xl">🌷</div>

          <h1 className="mt-4 text-xl font-bold text-[#4f4144]">
            ไม่พบสินค้า
          </h1>

          <p className="mt-2 text-sm leading-6 text-gray-500">
            {errorMessage}
          </p>

          <button
            type="button"
            onClick={() => router.push("/")}
            className="mt-6 rounded-2xl bg-[#df6f91] px-6 py-3 font-semibold text-white transition hover:bg-[#d35d82]"
          >
            กลับหน้าร้าน
          </button>
        </div>
      </main>
    );
  }

  const promotionActive =
    isPromotionActive(product);

  const currentPrice = getCurrentPrice(product);

  return (
    <main className="min-h-screen bg-[#fff9f5] text-[#4f4144]">
      <header className="sticky top-0 z-40 border-b border-pink-100 bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
          <button
            type="button"
            onClick={() => router.push("/")}
            className="text-left"
          >
            <h1 className="text-xl font-bold text-[#e27698]">
              queenb.sticker
            </h1>

            <p className="text-xs text-gray-500">
              Cute stickers & LINE themes ♡
            </p>
          </button>

          <button
            type="button"
            onClick={() => router.push("/")}
            className="rounded-2xl border border-pink-200 bg-white px-4 py-2.5 text-sm font-semibold text-[#d65f84] transition hover:bg-pink-50"
          >
            ← กลับหน้าร้าน
          </button>
        </div>
      </header>

      <section className="mx-auto max-w-6xl px-4 py-8 md:py-12">
        <div className="grid gap-6 overflow-hidden rounded-[36px] border border-pink-100 bg-white p-4 shadow-sm sm:p-5 md:grid-cols-[1.05fr_0.95fr] md:gap-8 md:p-8">
          <div>
            <div className="flex h-[360px] items-center justify-center overflow-hidden rounded-[28px] bg-pink-50 sm:h-[430px] md:h-auto md:aspect-square">
              <img
                src={
                  selectedPreviewImage ||
                  product.image
                }
                alt={product.name}
                className="h-full w-full max-w-full object-contain md:aspect-square md:h-auto"
              />
            </div>

            <div className="mt-4 flex max-w-full gap-3 overflow-x-auto pb-2">
              {product.previewImages.map(
                (previewImage, index) => (
                  <button
                    key={`${previewImage}-${index}`}
                    type="button"
                    onClick={() =>
                      setSelectedPreviewImage(
                        previewImage,
                      )
                    }
                    className={`h-20 w-20 shrink-0 overflow-hidden rounded-2xl border-2 bg-white transition sm:h-24 sm:w-24 ${
                      selectedPreviewImage ===
                      previewImage
                        ? "border-[#df6f91]"
                        : "border-transparent"
                    }`}
                  >
                    <img
                      src={previewImage}
                      alt={`${product.name} ตัวอย่าง ${
                        index + 1
                      }`}
                      className="h-full w-full object-cover"
                    />
                  </button>
                ),
              )}
            </div>
          </div>

          <div className="flex flex-col">
            <div className="flex flex-wrap gap-2">
              {promotionActive && (
                <span className="rounded-full bg-[#ef7898] px-3 py-1.5 text-xs font-bold text-white">
                  🎀 PROMO
                </span>
              )}

              {product.isBestSeller && (
                <span className="rounded-full bg-amber-400 px-3 py-1.5 text-xs font-bold text-white">
                  🔥 BEST SELLER
                </span>
              )}
            </div>

            <p className="mt-2 text-sm font-semibold text-[#d47691] md:mt-5">
              {product.category === "Sticker"
                ? "LINE Sticker"
                : "LINE Theme"}
            </p>

            <h2 className="mt-2 text-3xl font-bold leading-tight md:text-4xl">
              {product.name}
            </h2>

            <div className="mt-6 flex flex-wrap items-center gap-3">
              <p className="text-4xl font-bold text-[#df6388]">
                ฿{formatPrice(currentPrice)}
              </p>

              {promotionActive && (
                <span className="text-lg text-gray-400 line-through">
                  ฿
                  {formatPrice(
                    product.regularPrice,
                  )}
                </span>
              )}
            </div>

            {promotionActive &&
              product.promotionEnd && (
                <p className="mt-2 text-sm text-gray-500">
                  หมดโปรโมชั่น{" "}
                  {formatDate(
                    product.promotionEnd,
                  )}
                </p>
              )}

            <div className="mt-7 rounded-3xl bg-[#fff7fa] p-5">
              <h3 className="font-bold">
                รายละเอียดสินค้า
              </h3>

              <p className="mt-2 text-sm leading-7 text-gray-600">
                ดูภาพตัวอย่างก่อนสั่งซื้อ
                และสามารถเพิ่มสินค้าลายเดียวกันหลายชุด
                เพื่อส่งให้ผู้รับหลาย LINE ID ได้ค่ะ
              </p>

              {product.lineStoreUrl && (
                <a
                  href={product.lineStoreUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-5 flex w-full items-center justify-center rounded-2xl bg-[#06c755] px-4 py-3.5 font-semibold text-white transition hover:bg-[#05b84e]"
                >
                  เปิดสินค้าใน LINE Store
                </a>
              )}

              <button
                type="button"
                onClick={addToCart}
                className="mt-3 w-full rounded-2xl bg-[#df6f91] px-4 py-3.5 font-semibold text-white transition hover:bg-[#d35d82]"
              >
                {cartQuantity > 0
                  ? "เพิ่มจำนวนอีก 1 ชุด +"
                  : "เพิ่มลงตะกร้า"}
              </button>

              {cartQuantity > 0 && (
                <div className="mt-3 rounded-2xl bg-green-50 px-4 py-3 text-sm font-semibold text-green-700">
                  อยู่ในตะกร้าแล้ว {cartQuantity} ชุด
                </div>
              )}

              {addedMessage && (
                <div className="mt-3 rounded-2xl bg-green-50 px-4 py-3 text-sm font-semibold text-green-700">
                  {addedMessage}
                </div>
              )}
            </div>

            <div className="mt-5 rounded-3xl border border-pink-100 p-5">
              <h3 className="font-bold">
                วิธีสั่งซื้อ
              </h3>

              <ol className="mt-3 space-y-3 text-sm leading-6 text-gray-600">
                <li>
                  1. เลือกสินค้าที่ต้องการ
                </li>
                <li>
                  2. เพิ่มจำนวนตามจำนวนผู้รับ
                </li>
                <li>
                  3. กลับหน้าร้านเพื่อเปิดตะกร้า
                  และส่งรายการให้ร้าน
                </li>
              </ol>

              <button
                type="button"
                onClick={() => router.push("/")}
                className="mt-5 w-full rounded-2xl border border-pink-200 bg-white px-4 py-3.5 font-semibold text-[#d65f84] transition hover:bg-pink-50"
              >
                กลับไปเลือกสินค้าเพิ่มเติม
              </button>
            </div>
          </div>
        </div>
      </section>

      {cartLoaded && cart.length > 0 && (
        <button
          type="button"
          onClick={() => router.push("/")}
          className="fixed bottom-5 left-1/2 z-50 flex w-[calc(100%-32px)] max-w-md -translate-x-1/2 items-center justify-between rounded-full bg-[#df6f91] px-5 py-4 text-white shadow-xl transition hover:bg-[#d55f84] md:left-auto md:right-6 md:w-auto md:translate-x-0"
        >
          <span className="font-semibold">
            🛒 ตะกร้า {totalCartQuantity} ชุด
          </span>

          <span className="ml-6 font-bold">
            ฿{formatPrice(totalCartPrice)}
          </span>
        </button>
      )}
    </main>
  );
}
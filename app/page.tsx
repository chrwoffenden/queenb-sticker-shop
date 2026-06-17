"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
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
  preview_images: string[];
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

type ContactType = "line-id" | "qr-code";
type CopyStatus = "idle" | "copied" | "error";
type CategoryFilter = "all" | "Sticker" | "Theme";

type ProductCardProps = {
  product: Product;
  showBestSellerBadge?: boolean;
  productInCart: boolean;
  onAddToCart: (product: Product) => void;
};

const CART_STORAGE_KEY = "queenb-cart";
const SHOP_LINE_URL = "https://line.me/R/ti/p/@ecx0250y";

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

function createOrderNumber() {
  const now = new Date();

  const year = String(now.getFullYear()).slice(-2);
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  const random = String(Math.floor(Math.random() * 10000)).padStart(4, "0");

  return `QB-${year}${month}${day}-${random}`;
}

function countLineRecipients(value: string) {
  return value
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean).length;
}

function getProductUrl(
  slug: string,
  lineStoreUrl?: string,
) {
  if (lineStoreUrl) {
    return lineStoreUrl;
  }

  if (typeof window === "undefined") {
    return `/product/${slug}`;
  }

  return `${window.location.origin}/product/${slug}`;
}

async function copyTextToClipboard(text: string) {
  if (navigator.clipboard && window.isSecureContext) {
    await navigator.clipboard.writeText(text);
    return;
  }

  const textArea = document.createElement("textarea");
  textArea.value = text;
  textArea.style.position = "fixed";
  textArea.style.left = "-9999px";
  textArea.style.top = "-9999px";

  document.body.appendChild(textArea);
  textArea.focus();
  textArea.select();

  const successful = document.execCommand("copy");
  document.body.removeChild(textArea);

  if (!successful) {
    throw new Error("ไม่สามารถคัดลอกข้อความได้");
  }
}

function ProductCard({
  product,
  showBestSellerBadge = false,
  productInCart,
  onAddToCart,
}: ProductCardProps) {
  const promotionActive = isPromotionActive(product);
  const currentPrice = getCurrentPrice(product);

  return (
    <article
      className={`relative flex h-full flex-col overflow-hidden rounded-[26px] bg-white shadow-[0_8px_24px_rgba(148,93,112,0.08)] transition hover:-translate-y-1 hover:shadow-[0_12px_30px_rgba(148,93,112,0.12)] ${
        showBestSellerBadge
          ? "border-2 border-amber-200"
          : "border border-pink-100"
      }`}
    >
      <Link
        href={`/product/${product.slug}`}
        className="block aspect-square w-full overflow-hidden bg-pink-50"
        aria-label={`ดูรายละเอียด ${product.name}`}
      >
        <img
          src={product.image}
          alt={product.name}
          className="h-full w-full object-cover transition duration-300 hover:scale-105"
        />
      </Link>

      <div className="flex flex-1 flex-col p-3.5 md:p-4">
        {(promotionActive || showBestSellerBadge) && (
          <div className="mb-3 flex flex-wrap gap-2">
            {promotionActive && (
              <span className="rounded-full bg-[#fff0f5] px-2.5 py-1 text-[10px] font-bold text-[#d95f85] md:text-xs">
                🎀 PROMO
              </span>
            )}

            {showBestSellerBadge && (
              <span className="rounded-full bg-[#fff5d9] px-2.5 py-1 text-[10px] font-bold text-[#b98212] md:text-xs">
                🔥 BEST SELLER
              </span>
            )}
          </div>
        )}

        <span className="text-xs font-medium text-[#d47691]">
          {product.category === "Sticker" ? "LINE Sticker" : "LINE Theme"}
        </span>

        <Link
          href={`/product/${product.slug}`}
          className="mt-1 block min-h-0 text-sm font-bold leading-6 transition hover:text-[#d65f84] md:min-h-[48px] md:text-base"
        >
          {product.name}
        </Link>

        <div className="mt-2 min-h-0 md:min-h-[58px]">
          {promotionActive ? (
            <>
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-lg font-bold text-[#e06489]">
                  ฿{formatPrice(currentPrice)}
                </span>

                <span className="text-xs text-gray-400 line-through">
                  ฿{formatPrice(product.regularPrice)}
                </span>
              </div>

              <p className="mt-1 text-[11px] text-gray-500">
                หมดโปรโมชั่น {formatDate(product.promotionEnd)}
              </p>
            </>
          ) : (
            <p className="text-lg font-bold text-[#e06489]">
              ฿{formatPrice(product.regularPrice)}
            </p>
          )}
        </div>

        <div className="mt-auto pt-4">
          {product.lineStoreUrl && (
            <a
              href={product.lineStoreUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex w-full items-center justify-center rounded-2xl border border-[#bde9cb] bg-[#f3fff7] px-3 py-2.5 text-sm font-semibold text-[#179a49] transition hover:bg-[#e8fff0]"
            >
              เปิดใน LINE Store
            </a>
          )}

          <button
            type="button"
            onClick={() => onAddToCart(product)}
            className={`w-full rounded-2xl px-3 py-2.5 text-sm font-semibold transition ${
              product.lineStoreUrl ? "mt-2" : ""
            } ${
              productInCart
                ? "bg-[#e9f9ef] text-[#18834a] hover:bg-[#dcf4e5]"
                : "bg-[#df6f91] text-white hover:bg-[#d35d82]"
            }`}
          >
            {productInCart
              ? "เพิ่มจำนวนอีก 1 ชุด +"
              : "เพิ่มลงตะกร้า"}
          </button>
        </div>
      </div>
    </article>
  );
}

export default function HomePage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [productsLoading, setProductsLoading] = useState(true);
  const [productsError, setProductsError] = useState("");

  const [cart, setCart] = useState<CartItem[]>([]);
  const [cartLoaded, setCartLoaded] = useState(false);

  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);

  const [contactType, setContactType] =
    useState<ContactType>("qr-code");

  const [recipientInfo, setRecipientInfo] = useState("");
  const [note, setNote] = useState("");
  const [orderNumber, setOrderNumber] = useState("");
  const [copyStatus, setCopyStatus] =
    useState<CopyStatus>("idle");

  const [categoryFilter, setCategoryFilter] =
    useState<CategoryFilter>("all");

  const bestSellerProducts = products.filter(
    (product) => product.isBestSeller === true,
  );

  const filteredProducts =
    categoryFilter === "all"
      ? products
      : products.filter(
          (product) =>
            product.category === categoryFilter,
        );

  useEffect(() => {
    const loadProducts = async () => {
      setProductsLoading(true);
      setProductsError("");

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
        .eq("is_active", true)
        .order("id", { ascending: true });

      if (error) {
        console.error("โหลดสินค้าไม่สำเร็จ", error);
        setProductsError("ไม่สามารถโหลดสินค้าได้ กรุณาลองใหม่อีกครั้ง");
        setProductsLoading(false);
        return;
      }

      const formattedProducts: Product[] = (
        (data ?? []) as SupabaseProduct[]
      ).map((product) => ({
        id: product.id,
        name: product.name,
        category: product.category,
        image: product.image,
        previewImages:
          product.preview_images?.length > 0
            ? product.preview_images
            : [product.image],
        regularPrice: Number(product.regular_price),
        salePrice:
          product.sale_price === null
            ? undefined
            : Number(product.sale_price),
        promotionEnd: product.promotion_end ?? undefined,
        slug: product.slug,
        lineStoreUrl: product.line_store_url ?? undefined,
        isBestSeller: product.is_best_seller,
      }));

      setProducts(formattedProducts);
      setProductsLoading(false);
    };

    loadProducts();
  }, []);

  useEffect(() => {
    try {
      const savedCart = localStorage.getItem(CART_STORAGE_KEY);

      if (savedCart) {
        const parsedCart = JSON.parse(savedCart) as CartItem[];

        if (Array.isArray(parsedCart)) {
          setCart(parsedCart);
        }
      }
    } catch (error) {
      console.error("ไม่สามารถโหลดตะกร้าได้", error);
      localStorage.removeItem(CART_STORAGE_KEY);
    } finally {
      setCartLoaded(true);
    }
  }, []);

  useEffect(() => {
    if (!cartLoaded) return;

    localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart));
  }, [cart, cartLoaded]);

  useEffect(() => {
    if (!cartLoaded || productsLoading) return;

    setCart((currentCart) =>
      currentCart
        .map((cartItem) => {
          const latestProduct = products.find(
            (product) => product.id === cartItem.id,
          );

          if (!latestProduct) {
            return null;
          }

          return {
            ...latestProduct,
            quantity: cartItem.quantity,
          };
        })
        .filter(
          (item): item is CartItem => item !== null,
        ),
    );
  }, [cartLoaded, products, productsLoading]);

  useEffect(() => {
    const hasOpenModal =
      isCartOpen || isCheckoutOpen;

    document.body.style.overflow = hasOpenModal ? "hidden" : "";

    return () => {
      document.body.style.overflow = "";
    };
  }, [isCartOpen, isCheckoutOpen]);

  const totalQuantity = useMemo(() => {
    return cart.reduce((total, item) => total + item.quantity, 0);
  }, [cart]);

  const totalPrice = useMemo(() => {
    return cart.reduce((total, item) => {
      return total + getCurrentPrice(item) * item.quantity;
    }, 0);
  }, [cart]);

  const recipientLineCount = useMemo(() => {
    return countLineRecipients(recipientInfo);
  }, [recipientInfo]);

  const recipientCountMatches =
    contactType !== "line-id" ||
    recipientLineCount === totalQuantity;

  const addToCart = (product: Product) => {
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
  };

  const increaseQuantity = (productId: number) => {
    setCart((currentCart) =>
      currentCart.map((item) =>
        item.id === productId
          ? {
              ...item,
              quantity: item.quantity + 1,
            }
          : item,
      ),
    );
  };

  const decreaseQuantity = (productId: number) => {
    setCart((currentCart) =>
      currentCart
        .map((item) =>
          item.id === productId
            ? {
                ...item,
                quantity: item.quantity - 1,
              }
            : item,
        )
        .filter((item) => item.quantity > 0),
    );
  };

  const removeFromCart = (productId: number) => {
    setCart((currentCart) =>
      currentCart.filter((item) => item.id !== productId),
    );
  };

  const resetOrderState = () => {
    setCart([]);
    setIsCartOpen(false);
    setIsCheckoutOpen(false);
    setRecipientInfo("");
    setNote("");
    setCopyStatus("idle");
    setOrderNumber("");
  };

  const clearCart = () => {
    const confirmed = window.confirm(
      "ต้องการล้างสินค้าทั้งหมดออกจากตะกร้าใช่ไหม?",
    );

    if (!confirmed) return;

    resetOrderState();
  };

  const clearCartAfterOrder = () => {
    const confirmed = window.confirm(
      "ส่งรายการให้ร้านเรียบร้อยแล้ว และต้องการล้างตะกร้าใช่ไหม?",
    );

    if (!confirmed) return;

    resetOrderState();
  };

  const isInCart = (productId: number) => {
    return cart.some((item) => item.id === productId);
  };

  const getCartQuantity = (productId: number) => {
    return (
      cart.find((item) => item.id === productId)?.quantity ?? 0
    );
  };

  const openCheckout = () => {
    if (cart.length === 0) return;

    setOrderNumber(createOrderNumber());
    setCopyStatus("idle");
    setIsCartOpen(false);
    setIsCheckoutOpen(true);
  };

  const buildOrderMessage = () => {
    const productLines = cart
      .map((item, index) => {
        const unitPrice = getCurrentPrice(item);
        const itemTotal = unitPrice * item.quantity;

        const promotionText =
          isPromotionActive(item) && item.promotionEnd
            ? `🎀 โปรโมชั่นหมดวันที่: ${formatDate(
                item.promotionEnd,
              )}`
            : "🎀 โปรโมชั่น: ไม่มีหรือหมดอายุแล้ว";

        return [
          `🌷 รายการที่ ${index + 1}`,
          `🧸 ชื่อสินค้า: ${item.name}`,
          `🏷️ ประเภท: ${
            item.category === "Sticker"
              ? "LINE Sticker"
              : "LINE Theme"
          }`,
          `💖 ราคาต่อชุด: ${formatPrice(unitPrice)} บาท`,
          `🔢 จำนวน: ${item.quantity} ชุด`,
          `💰 รวมรายการนี้: ${formatPrice(itemTotal)} บาท`,
          `🔗 ลิงก์สินค้า: ${getProductUrl(
            item.slug,
            item.lineStoreUrl,
          )}`,
          promotionText,
        ].join("\n");
      })
      .join("\n\n");

    const contactText =
      contactType === "line-id"
        ? [
            "👤 LINE ID ผู้รับ:",
            recipientInfo.trim() || "-",
          ].join("\n")
        : [
            "👤 ช่องทางผู้รับ: ส่ง QR Code LINE ในแชทร้าน",
            `📌 กรุณาแนบ QR Code ตามจำนวนผู้รับทั้งหมด ${totalQuantity} รูป`,
          ].join("\n");

    const noteText = note.trim()
      ? `📝 หมายเหตุ: ${note.trim()}`
      : "📝 หมายเหตุ: -";

    return [
      "สวัสดีค่ะ สนใจสั่งซื้อสินค้าจาก queenb.sticker ♡",
      "",
      "━━━━━━━━━━━━━━",
      "🛒 รายการสั่งซื้อ",
      "━━━━━━━━━━━━━━",
      "",
      `🧾 เลขที่รายการ: ${orderNumber}`,
      "",
      productLines,
      "",
      "━━━━━━━━━━━━━━",
      `📦 จำนวนแบบสินค้า: ${cart.length} รายการ`,
      `🎁 จำนวนที่ซื้อทั้งหมด: ${totalQuantity} ชุด`,
      `💰 ยอดรวมทั้งหมด: ${formatPrice(totalPrice)} บาท`,
      "━━━━━━━━━━━━━━",
      "",
      contactText,
      "",
      noteText,
      "",
      "ขอบคุณค่ะ ♡🌷",
    ].join("\n");
  };

  const handleCopyOrder = async () => {
    if (
      contactType === "line-id" &&
      recipientLineCount !== totalQuantity
    ) {
      setCopyStatus("error");
      return;
    }

    try {
      await copyTextToClipboard(buildOrderMessage());
      setCopyStatus("copied");
    } catch (error) {
      console.error("ไม่สามารถคัดลอกรายการได้", error);
      setCopyStatus("error");
    }
  };

  const handleOpenLine = () => {
    if (copyStatus !== "copied") {
      setCopyStatus("error");
      return;
    }

    window.open(
      SHOP_LINE_URL,
      "_blank",
      "noopener,noreferrer",
    );
  };

  return (
    <main className="min-h-screen bg-[#fff9f5] text-[#4f4144]">
      <header className="sticky top-0 z-40 border-b border-[#f7dce5] bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3.5">
          <a href="#home" className="flex items-center gap-3">
            <img
              src="/images/logo-icon.png"
              alt="queenb.sticker logo"
              className="h-11 w-11 rounded-2xl object-contain shadow-sm"
            />

            <div>
              <h1 className="text-lg font-bold text-[#df6f91] md:text-xl">
                queenb.sticker
              </h1>

              <p className="text-[11px] text-[#806d72] md:text-xs">
                Cute stickers & LINE themes
              </p>
            </div>
          </a>

          <nav className="hidden items-center gap-6 text-sm font-medium text-[#6f5c62] md:flex">
            <a href="#home" className="transition hover:text-[#df6f91]">
              หน้าแรก
            </a>

            <a href="#best-seller" className="transition hover:text-[#df6f91]">
              สินค้าขายดี
            </a>

            <a href="#products" className="transition hover:text-[#df6f91]">
              สินค้าทั้งหมด
            </a>

            <a href="#how-to-order" className="transition hover:text-[#df6f91]">
              วิธีสั่งซื้อ
            </a>
          </nav>

          <button
            type="button"
            onClick={() => setIsCartOpen(true)}
            disabled={!cartLoaded || cart.length === 0}
            className={`relative rounded-2xl px-4 py-2.5 text-sm font-semibold transition ${
              cartLoaded && cart.length > 0
                ? "bg-[#fff1f5] text-[#d65f84] hover:bg-[#ffe5ee]"
                : "cursor-not-allowed bg-gray-100 text-gray-400"
            }`}
          >
            🛒 ตะกร้า
            {totalQuantity > 0 && (
              <span className="ml-2 inline-flex min-w-6 items-center justify-center rounded-full bg-[#df6f91] px-1.5 py-0.5 text-xs text-white">
                {totalQuantity}
              </span>
            )}
          </button>
        </div>
      </header>

      <section
        id="home"
        className="mx-auto max-w-6xl px-4 pb-8 pt-6 md:pb-16 md:pt-12"
      >
        <div className="overflow-hidden rounded-[30px] border border-[#f7dce5] bg-gradient-to-br from-[#fff1f5] via-[#fff9f5] to-[#fff5e8] p-5 shadow-sm md:rounded-[34px] md:p-10">
          <div className="grid items-center gap-6 md:grid-cols-[1.05fr_0.95fr] md:gap-8">
            <div className="text-center md:text-left">
              <span className="inline-flex rounded-full bg-white px-4 py-2 text-xs font-semibold text-[#d4678b] shadow-sm">
                LINE Stickers & Themes ♡
              </span>

              <h2 className="mt-4 text-[28px] font-bold leading-tight text-[#654d56] md:mt-5 md:text-5xl">
                เติมความน่ารัก
                <br />
                ให้ทุกแชทของคุณ
              </h2>

              <p className="mx-auto mt-4 max-w-xl text-sm leading-6 text-[#806d72] md:mx-0 md:mt-5 md:text-base md:leading-7">
                เลือกสติกเกอร์และธีม LINE ลายน่ารัก
                เพิ่มจำนวนตามผู้รับ
                แล้วส่งรายการสั่งซื้อผ่านแชท LINE ร้านได้ง่าย ๆ
              </p>

              <div className="mt-6 flex flex-col items-center gap-3 md:mt-7 md:flex-row md:justify-start">
                <a
                  href="#products"
                  className="inline-flex w-full items-center justify-center rounded-full bg-[#df6f91] px-7 py-3 text-sm font-semibold text-white shadow-md transition hover:-translate-y-0.5 hover:bg-[#d35d82] sm:w-auto"
                >
                  เลือกซื้อสินค้า
                </a>

                <a
                  href={SHOP_LINE_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hidden items-center justify-center rounded-full border border-[#bde9cb] bg-white px-7 py-3 text-sm font-semibold text-[#19a84d] transition hover:bg-[#f2fff6] md:inline-flex"
                >
                  แอด LINE ร้าน
                </a>

                <a
                  href={SHOP_LINE_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs font-semibold text-[#19a84d] underline-offset-4 hover:underline md:hidden"
                >
                  หรือแอด LINE ร้าน
                </a>
              </div>
            </div>

            <div className="relative mx-auto w-full max-w-md">
              <div className="absolute -left-3 top-8 h-20 w-20 rounded-full bg-[#ffdce8] blur-2xl" />
              <div className="absolute -right-3 bottom-8 h-24 w-24 rounded-full bg-[#fff0be] blur-2xl" />

              <div className="relative rounded-[26px] bg-white/70 p-3 shadow-sm backdrop-blur md:grid md:grid-cols-2 md:gap-3 md:rounded-[30px]">
                {products.length > 0 ? (
                  <>
                    <a
                      href={`/product/${products[0].slug}`}
                      className="block overflow-hidden rounded-2xl bg-white shadow-sm md:col-span-2"
                    >
                      <img
                        src={products[0].image}
                        alt={products[0].name}
                        className="aspect-[4/3] w-full object-cover md:aspect-[2/1]"
                      />
                    </a>

                    {products.slice(1, 3).map((product) => (
                      <a
                        key={`hero-${product.id}`}
                        href={`/product/${product.slug}`}
                        className="hidden overflow-hidden rounded-2xl bg-white shadow-sm md:block"
                      >
                        <img
                          src={product.image}
                          alt={product.name}
                          className="aspect-square w-full object-cover"
                        />
                      </a>
                    ))}
                  </>
                ) : (
                  <div className="flex aspect-[4/3] items-center justify-center rounded-2xl bg-[#fff7fa] text-sm text-[#b28f9a] md:col-span-2">
                    Cute products are coming ♡
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {productsLoading && (
        <section className="mx-auto max-w-6xl px-4 pb-14">
          <div className="rounded-3xl border border-pink-100 bg-white p-8 text-center text-sm text-gray-500 shadow-sm">
            กำลังโหลดสินค้า...
          </div>
        </section>
      )}

      {productsError && (
        <section className="mx-auto max-w-6xl px-4 pb-14">
          <div className="rounded-3xl bg-red-50 p-8 text-center text-sm text-red-600">
            {productsError}
          </div>
        </section>
      )}

      {!productsLoading &&
        !productsError &&
        products.length === 0 && (
          <section className="mx-auto max-w-6xl px-4 pb-14">
            <div className="rounded-3xl border border-pink-100 bg-white p-8 text-center text-sm text-gray-500 shadow-sm">
              ยังไม่มีสินค้าในร้าน
            </div>
          </section>
        )}

      {bestSellerProducts.length > 0 && (
        <section
          id="best-seller"
          className="mx-auto max-w-6xl px-4 pb-14"
        >
          <div className="rounded-[32px] border border-amber-100 bg-gradient-to-br from-[#fff8e8] via-[#fffafd] to-[#fff0f5] p-5 md:p-8">
            <div className="mb-7 flex items-end justify-between">
              <div>
                <p className="text-sm font-semibold text-amber-600">
                  Best Seller
                </p>

                <h2 className="mt-1 text-2xl font-bold md:text-3xl">
                  สินค้าขายดีประจำร้าน 🔥
                </h2>

                <p className="mt-2 text-sm text-gray-500">
                  ลายยอดนิยมที่ลูกค้าเลือกซื้อบ่อย
                </p>

                <p className="mt-2 text-xs text-amber-600 md:hidden">
                  เลื่อนซ้าย–ขวาเพื่อดูสินค้าเพิ่มเติม
                </p>
              </div>

              <span className="hidden text-sm text-gray-500 sm:block">
                {bestSellerProducts.length} รายการ
              </span>
            </div>

            <div className="flex snap-x snap-mandatory gap-4 overflow-x-auto pb-3 md:grid md:grid-cols-[repeat(auto-fit,minmax(240px,320px))] md:justify-center md:gap-6 md:overflow-visible">
              {bestSellerProducts.map((product) => (
                <div
                  key={`best-${product.id}`}
                  className="w-[78vw] max-w-[280px] shrink-0 snap-start md:w-full md:max-w-[320px]"
                >
                  <ProductCard
                    product={product}
                    showBestSellerBadge
                    productInCart={isInCart(product.id)}
                    onAddToCart={addToCart}
                  />
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      <section
        id="products"
        className="mx-auto max-w-6xl px-4 pb-28"
      >
        <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-sm font-semibold text-[#df7796]">
              Our Products
            </p>

            <h2 className="mt-1 text-2xl font-bold md:text-3xl">
              เลือกลายที่คุณชอบ
            </h2>

            <p className="mt-2 text-sm text-gray-500">
              กดที่รูปหรือชื่อสินค้าเพื่อดูรายละเอียดเพิ่มเติม
            </p>
          </div>

          <span className="text-sm text-gray-500">
            {filteredProducts.length} รายการ
          </span>
        </div>

        <div className="mb-6 flex gap-2 overflow-x-auto pb-2">
          {[
            ["all", "ทั้งหมด"],
            ["Sticker", "LINE Sticker"],
            ["Theme", "LINE Theme"],
          ].map(([value, label]) => (
            <button
              key={value}
              type="button"
              onClick={() =>
                setCategoryFilter(
                  value as CategoryFilter,
                )
              }
              className={`shrink-0 rounded-full px-5 py-2.5 text-sm font-semibold transition ${
                categoryFilter === value
                  ? "bg-[#df6f91] text-white shadow-sm"
                  : "border border-[#f2d5df] bg-white text-[#7d666e] hover:bg-[#fff1f5]"
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-2 items-stretch gap-3 md:grid-cols-3 md:gap-6 lg:grid-cols-4">
          {filteredProducts.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              productInCart={isInCart(product.id)}
              onAddToCart={addToCart}
            />
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 pb-14">
        <div className="grid gap-4 md:grid-cols-3">
          {[
            [
              "💬",
              "สั่งซื้อผ่าน LINE",
              "คัดลอกรายการแล้วส่งให้ร้านผ่านแชทได้ทันที",
            ],
            [
              "🎁",
              "ส่งให้ตัวเองหรือเพื่อน",
              "รองรับหลายผู้รับด้วย LINE ID หรือ QR Code",
            ],
            [
              "🌷",
              "ร้านดูแลทุกขั้นตอน",
              "สอบถามรายละเอียดสินค้าและการสั่งซื้อได้ทางแชท",
            ],
          ].map(([icon, title, description]) => (
            <div
              key={title}
              className="rounded-3xl border border-[#f7dce5] bg-white p-6 shadow-sm"
            >
              <div className="text-3xl">{icon}</div>
              <h3 className="mt-4 font-bold text-[#5c4a50]">
                {title}
              </h3>
              <p className="mt-2 text-sm leading-6 text-gray-500">
                {description}
              </p>
            </div>
          ))}
        </div>
      </section>

      <section
        id="how-to-order"
        className="border-t border-pink-100 bg-white px-4 py-14"
      >
        <div className="mx-auto max-w-4xl text-center">
          <p className="text-sm font-semibold text-[#df7796]">
            How to Order
          </p>

          <h2 className="mt-2 text-2xl font-bold">
            สั่งซื้อง่ายเพียง 3 ขั้นตอน
          </h2>

          <div className="mt-8 grid gap-4 md:grid-cols-3">
            {[
              [
                "1",
                "เลือกสินค้า",
                "เพิ่มลายที่ต้องการลงในตะกร้า",
              ],
              [
                "2",
                "กำหนดจำนวน",
                "กดเพิ่มจำนวนตามจำนวน LINE ID ผู้รับ",
              ],
              [
                "3",
                "ส่งให้ร้าน",
                "คัดลอกรายการและเปิดแชท LINE ร้าน",
              ],
            ].map(([number, title, description]) => (
              <div
                key={number}
                className="rounded-3xl bg-[#fff8fa] p-6"
              >
                <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-[#f5a2bb] font-bold text-white">
                  {number}
                </div>

                <h3 className="mt-4 font-bold">{title}</h3>

                <p className="mt-2 text-sm leading-6 text-gray-500">
                  {description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {cartLoaded && cart.length > 0 && (
        <button
          type="button"
          onClick={() => setIsCartOpen(true)}
          className="fixed bottom-5 left-1/2 z-50 flex w-[calc(100%-32px)] max-w-md -translate-x-1/2 items-center justify-between rounded-full bg-[#df6f91] px-5 py-4 text-white shadow-xl transition hover:bg-[#d55f84] md:left-auto md:right-6 md:w-auto md:translate-x-0"
        >
          <span className="font-semibold">
            🛒 ตะกร้า {totalQuantity} ชุด
          </span>

          <span className="ml-6 font-bold">
            ฿{formatPrice(totalPrice)}
          </span>
        </button>
      )}

      {isCartOpen && (
        <div className="fixed inset-0 z-[60]">
          <button
            type="button"
            aria-label="ปิดตะกร้า"
            onClick={() => setIsCartOpen(false)}
            className="absolute inset-0 bg-black/40"
          />

          <div className="absolute bottom-0 left-0 right-0 max-h-[88vh] overflow-y-auto rounded-t-[32px] bg-white p-5 shadow-2xl md:bottom-6 md:left-auto md:right-6 md:max-h-[90vh] md:w-[440px] md:rounded-[32px]">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-[#df7796]">
                  Shopping Cart
                </p>

                <h2 className="text-xl font-bold">
                  ตะกร้าของฉัน
                </h2>
              </div>

              <button
                type="button"
                aria-label="ปิด"
                onClick={() => setIsCartOpen(false)}
                className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-100 text-lg"
              >
                ✕
              </button>
            </div>

            <div className="mt-5 space-y-3">
              {cart.map((item) => {
                const unitPrice = getCurrentPrice(item);
                const itemTotal = unitPrice * item.quantity;

                return (
                  <div
                    key={item.id}
                    className="rounded-2xl border border-pink-100 p-3"
                  >
                    <div className="flex gap-3">
                      <img
                        src={item.image}
                        alt={item.name}
                        className="h-20 w-20 rounded-xl object-cover"
                      />

                      <div className="min-w-0 flex-1">
                        <p className="line-clamp-2 text-sm font-bold">
                          {item.name}
                        </p>

                        <p className="mt-1 text-xs text-gray-500">
                          ฿{formatPrice(unitPrice)} ต่อชุด
                        </p>

                        <p className="mt-1 text-sm font-semibold text-[#df6f91]">
                          รวม ฿{formatPrice(itemTotal)}
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={() => removeFromCart(item.id)}
                        className="self-start rounded-full bg-red-50 px-2.5 py-1 text-xs text-red-500 transition hover:bg-red-100"
                      >
                        ลบ
                      </button>
                    </div>

                    <div className="mt-3 flex items-center justify-between rounded-2xl bg-[#fff7fa] p-2">
                      <span className="pl-2 text-xs font-medium text-gray-500">
                        จำนวน
                      </span>

                      <div className="flex items-center gap-3">
                        <button
                          type="button"
                          onClick={() =>
                            decreaseQuantity(item.id)
                          }
                          className="flex h-9 w-9 items-center justify-center rounded-full bg-white text-lg font-bold text-[#d65f84] shadow-sm"
                          aria-label="ลดจำนวน"
                        >
                          −
                        </button>

                        <span className="min-w-6 text-center font-bold">
                          {item.quantity}
                        </span>

                        <button
                          type="button"
                          onClick={() =>
                            increaseQuantity(item.id)
                          }
                          className="flex h-9 w-9 items-center justify-center rounded-full bg-[#ffe1eb] text-lg font-bold text-[#d65f84]"
                          aria-label="เพิ่มจำนวน"
                        >
                          +
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="mt-5 rounded-2xl bg-[#fff4f7] p-4">
              <div className="flex justify-between text-sm">
                <span>จำนวนแบบสินค้า</span>
                <span>{cart.length} รายการ</span>
              </div>

              <div className="mt-2 flex justify-between text-sm">
                <span>จำนวนที่ซื้อทั้งหมด</span>
                <span>{totalQuantity} ชุด</span>
              </div>

              <div className="mt-3 flex justify-between text-lg font-bold">
                <span>ยอดรวม</span>

                <span className="text-[#df6388]">
                  ฿{formatPrice(totalPrice)}
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={openCheckout}
              className="mt-4 w-full rounded-2xl bg-[#df6f91] px-4 py-3.5 font-semibold text-white transition hover:bg-[#d35d82]"
            >
              ดำเนินการสั่งซื้อ
            </button>

            <button
              type="button"
              onClick={clearCart}
              className="mt-3 w-full rounded-2xl px-4 py-3 text-sm font-medium text-gray-500 transition hover:bg-gray-50"
            >
              ล้างตะกร้าทั้งหมด
            </button>
          </div>
        </div>
      )}

      {isCheckoutOpen && (
        <div className="fixed inset-0 z-[70]">
          <button
            type="button"
            aria-label="ปิดหน้าสรุปคำสั่งซื้อ"
            onClick={() => setIsCheckoutOpen(false)}
            className="absolute inset-0 bg-black/50"
          />

          <div className="absolute bottom-0 left-0 right-0 max-h-[94vh] overflow-y-auto rounded-t-[32px] bg-white p-5 shadow-2xl md:bottom-6 md:left-1/2 md:right-auto md:w-[600px] md:-translate-x-1/2 md:rounded-[32px] md:p-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-semibold text-[#df7796]">
                  Order Summary
                </p>

                <h2 className="mt-1 text-xl font-bold">
                  สรุปรายการสั่งซื้อ
                </h2>

                <p className="mt-1 text-xs text-gray-500">
                  เลขที่รายการ: {orderNumber}
                </p>
              </div>

              <button
                type="button"
                aria-label="ปิด"
                onClick={() => setIsCheckoutOpen(false)}
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gray-100 text-lg"
              >
                ✕
              </button>
            </div>

            <div className="mt-5 space-y-3">
              {cart.map((item, index) => {
                const unitPrice = getCurrentPrice(item);
                const itemTotal = unitPrice * item.quantity;

                return (
                  <div
                    key={item.id}
                    className="rounded-2xl border border-pink-100 p-4"
                  >
                    <div className="flex gap-3">
                      <img
                        src={item.image}
                        alt={item.name}
                        className="h-16 w-16 rounded-xl object-cover"
                      />

                      <div className="min-w-0 flex-1">
                        <p className="text-xs text-gray-400">
                          รายการที่ {index + 1}
                        </p>

                        <p className="mt-1 font-bold">
                          {item.name}
                        </p>

                        <p className="mt-1 text-sm text-gray-500">
                          ฿{formatPrice(unitPrice)} ×{" "}
                          {item.quantity} ชุด
                        </p>

                        <p className="mt-1 font-semibold text-[#df6388]">
                          รวม ฿{formatPrice(itemTotal)}
                        </p>
                      </div>
                    </div>

                    <div className="mt-3 rounded-xl bg-[#fff8fa] p-3 text-xs leading-6 text-gray-600">
                      <p className="break-all">
                        ลิงก์สินค้า:{" "}
                        {getProductUrl(
                          item.slug,
                          item.lineStoreUrl,
                        )}
                      </p>

                      <p>
                        {isPromotionActive(item) &&
                        item.promotionEnd
                          ? `โปรโมชั่นหมดวันที่ ${formatDate(
                              item.promotionEnd,
                            )}`
                          : "ไม่มีโปรโมชั่น"}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="mt-5 rounded-2xl bg-[#fff2f6] p-4">
              <div className="flex justify-between text-sm">
                <span>จำนวนแบบสินค้า</span>
                <span>{cart.length} รายการ</span>
              </div>

              <div className="mt-2 flex justify-between text-sm">
                <span>จำนวนที่ซื้อทั้งหมด</span>
                <span>{totalQuantity} ชุด</span>
              </div>

              <div className="mt-3 flex justify-between text-xl font-bold">
                <span>ยอดรวม</span>

                <span className="text-[#df6388]">
                  ฿{formatPrice(totalPrice)}
                </span>
              </div>
            </div>

            <div className="mt-6">
              <p className="font-bold">
                ข้อมูล LINE ของผู้รับ
              </p>

              <p className="mt-1 text-xs leading-5 text-gray-500">
                กรณีซื้อหลายชุด สามารถแจ้ง LINE ID
                หรือส่ง QR Code แยกตามจำนวนผู้รับได้
              </p>

              <div className="mt-3 grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setContactType("line-id");
                    setCopyStatus("idle");
                  }}
                  className={`rounded-2xl border px-3 py-4 text-sm font-semibold transition ${
                    contactType === "line-id"
                      ? "border-[#e27898] bg-[#fff0f5] text-[#d75f84]"
                      : "border-gray-200 bg-white text-gray-500"
                  }`}
                >
                  กรอก LINE ID
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setContactType("qr-code");
                    setCopyStatus("idle");
                  }}
                  className={`rounded-2xl border px-3 py-4 text-sm font-semibold transition ${
                    contactType === "qr-code"
                      ? "border-[#e27898] bg-[#fff0f5] text-[#d75f84]"
                      : "border-gray-200 bg-white text-gray-500"
                  }`}
                >
                  ส่ง QR Code
                </button>
              </div>

              {contactType === "line-id" ? (
                <>
                  <textarea
                    value={recipientInfo}
                    onChange={(event) => {
                      setRecipientInfo(event.target.value);
                      setCopyStatus("idle");
                    }}
                    placeholder={`กรอก LINE ID แยกบรรทัด เช่น\nผู้รับ 1: line_one\nผู้รับ 2: line_two`}
                    rows={5}
                    className="mt-4 w-full resize-none rounded-2xl border border-pink-100 px-4 py-3 outline-none transition focus:border-[#e27898] focus:ring-2 focus:ring-pink-100"
                  />

                  <div
                    className={`mt-3 rounded-2xl px-4 py-3 text-sm ${
                      recipientCountMatches
                        ? "bg-green-50 text-green-700"
                        : "bg-amber-50 text-amber-700"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <span>
                        กรอกแล้ว {recipientLineCount} คน
                      </span>

                      <span className="font-semibold">
                        ต้องการ {totalQuantity} คน
                      </span>
                    </div>

                    <p className="mt-1 text-xs leading-5">
                      {recipientCountMatches
                        ? "จำนวน LINE ID ตรงกับจำนวนชุดสินค้าแล้ว ✓"
                        : recipientLineCount < totalQuantity
                          ? `ยังขาดอีก ${
                              totalQuantity -
                              recipientLineCount
                            } คน`
                          : `กรอกเกินมา ${
                              recipientLineCount -
                              totalQuantity
                            } คน`}
                    </p>
                  </div>
                </>
              ) : (
                <div className="mt-4 rounded-2xl bg-[#f4fff5] p-4 text-sm leading-6 text-[#4f7555]">
                  หลังจากคัดลอกรายการและเปิดแชทร้าน
                  กรุณาแนบ QR Code LINE ของผู้รับจำนวน{" "}
                  <strong>{totalQuantity} รูป</strong>{" "}
                  พร้อมระบุว่าแต่ละ QR รับสินค้าลายใดค่ะ
                </div>
              )}
            </div>

            <textarea
              value={note}
              onChange={(event) => {
                setNote(event.target.value);
                setCopyStatus("idle");
              }}
              placeholder="หมายเหตุถึงร้าน เช่น รายการที่ 1 ส่งให้ผู้รับคนที่ 1"
              rows={3}
              className="mt-5 w-full resize-none rounded-2xl border border-pink-100 px-4 py-3 outline-none transition focus:border-[#e27898] focus:ring-2 focus:ring-pink-100"
            />

            {copyStatus === "copied" && (
              <div className="mt-4 rounded-2xl bg-green-50 px-4 py-3 text-center text-sm text-green-700">
                คัดลอกรายการเรียบร้อยแล้ว ✓
              </div>
            )}

            {copyStatus === "error" && (
              <div className="mt-4 rounded-2xl bg-red-50 px-4 py-3 text-center text-sm text-red-600">
                {contactType === "line-id" &&
                recipientLineCount !== totalQuantity
                  ? `จำนวน LINE ID ต้องเท่ากับ ${totalQuantity} คน ตอนนี้กรอก ${recipientLineCount} คน`
                  : copyStatus !== "copied"
                    ? "กรุณาคัดลอกรายการสั่งซื้อก่อนเปิดแชท LINE ร้าน"
                    : "ไม่สามารถดำเนินการได้"}
              </div>
            )}

            <button
              type="button"
              onClick={handleCopyOrder}
              disabled={!recipientCountMatches}
              className={`mt-5 w-full rounded-2xl px-4 py-3.5 font-semibold text-white transition ${
                recipientCountMatches
                  ? "bg-[#df6f91] hover:bg-[#d35d82]"
                  : "cursor-not-allowed bg-gray-300"
              }`}
            >
              📋 คัดลอกรายการสั่งซื้อ
            </button>

            <button
              type="button"
              onClick={handleOpenLine}
              disabled={copyStatus !== "copied"}
              className={`mt-3 w-full rounded-2xl px-4 py-3.5 font-semibold text-white transition ${
                copyStatus === "copied"
                  ? "bg-[#21c45b] hover:bg-[#1caf50]"
                  : "cursor-not-allowed bg-gray-300"
              }`}
            >
              💬 เปิดแชท LINE ร้าน
            </button>
            {copyStatus === "copied" && (
              <button
                type="button"
                onClick={clearCartAfterOrder}
                className="mt-3 w-full rounded-2xl border border-green-200 bg-green-50 px-4 py-3.5 font-semibold text-green-700 transition hover:bg-green-100"
              >
                ✓ ส่งรายการแล้ว ล้างตะกร้า
              </button>
            )}


            <button
              type="button"
              onClick={() => {
                setIsCheckoutOpen(false);
                setIsCartOpen(true);
              }}
              className="mt-3 w-full rounded-2xl px-4 py-3 text-sm text-gray-500 transition hover:bg-gray-50"
            >
              กลับไปแก้ไขตะกร้า
            </button>
          </div>
        </div>
      )}
      <footer className="mt-4 border-t border-[#f7dce5] bg-[#fff1f5] px-4 py-10">
        <div className="mx-auto grid max-w-6xl gap-8 md:grid-cols-[1.2fr_0.8fr] md:items-end">
          <div>
            <h2 className="text-xl font-bold text-[#df6f91]">
              queenb.sticker
            </h2>
            <p className="mt-2 text-sm text-[#806d72]">
              Cute LINE stickers & themes ♡
            </p>
            <p className="mt-4 max-w-md text-sm leading-6 text-[#8d777e]">
              ร้านสติกเกอร์และธีม LINE ลายน่ารัก
              สั่งซื้อและสอบถามรายละเอียดผ่านแชท LINE ร้าน
            </p>
          </div>

          <div className="flex flex-wrap gap-3 md:justify-end">
            <a
              href={SHOP_LINE_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-full bg-[#06c755] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#05b84e]"
            >
              LINE ร้าน
            </a>

            <a
              href="#how-to-order"
              className="rounded-full border border-[#e9cbd5] bg-white px-5 py-2.5 text-sm font-semibold text-[#7d666e] transition hover:bg-[#fff8fa]"
            >
              วิธีสั่งซื้อ
            </a>
          </div>
        </div>

        <div className="mx-auto mt-8 max-w-6xl border-t border-[#efcfd9] pt-5 text-xs text-[#9b838b]">
          © 2026 queenb.sticker
        </div>
      </footer>

    </main>
  );
}
import { NextRequest, NextResponse } from "next/server";

type ProductCategory = "Sticker" | "Theme";

type LineStorePreviewResponse = {
  title: string;
  category: ProductCategory;
  coverImage: string;
  previewImages: string[];
};

function cleanText(value: string) {
  return value
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/\\u002F/g, "/")
    .replace(/\\\//g, "/")
    .replace(/\s+/g, " ")
    .trim();
}

function uniqueValues(values: string[]) {
  return Array.from(new Set(values.filter(Boolean)));
}

function resolveImageUrl(imageUrl: string, pageUrl: string) {
  try {
    return new URL(imageUrl, pageUrl).toString();
  } catch {
    return "";
  }
}

function pickMetaContent(html: string, patterns: RegExp[]) {
  for (const pattern of patterns) {
    const match = html.match(pattern);

    if (match?.[1]) {
      return cleanText(match[1]);
    }
  }

  return "";
}

function getProductId(url: string) {
  const patterns = [
    /\/S\/sticker\/(\d+)/i,
    /\/S\/theme\/([a-z0-9-]+)/i,
    /\/stickershop\/product\/(\d+)/i,
    /\/themeshop\/product\/([a-z0-9-]+)/i,
    /\/product\/([a-z0-9-]+)/i,
  ];

  for (const pattern of patterns) {
    const match = url.match(pattern);

    if (match?.[1]) {
      return match[1];
    }
  }

  return "";
}

function getCategoryFromUrl(url: string): ProductCategory {
  const lowerUrl = url.toLowerCase();

  if (
    lowerUrl.includes("/theme/") ||
    lowerUrl.includes("/themeshop/") ||
    lowerUrl.includes("theme")
  ) {
    return "Theme";
  }

  return "Sticker";
}

function normalizeLineStoreUrl(url: string) {
  const category = getCategoryFromUrl(url);
  const productId = getProductId(url);

  if (!productId) return url;

  if (category === "Theme") {
    return `https://store.line.me/themeshop/product/${productId}/th`;
  }

  return `https://store.line.me/stickershop/product/${productId}/th`;
}

function getTitle(html: string) {
  const rawTitle =
    pickMetaContent(html, [
      /<meta[^>]+property=["']og:title["'][^>]+content=["']([^"']+)["'][^>]*>/i,
      /<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:title["'][^>]*>/i,
      /<meta[^>]+name=["']twitter:title["'][^>]+content=["']([^"']+)["'][^>]*>/i,
      /<title[^>]*>([^<]+)<\/title>/i,
    ]) || "";

  return rawTitle
    .replace(/\s*\|\s*LINE STORE\s*$/i, "")
    .replace(/\s*-\s*LINE STORE\s*$/i, "")
    .replace(/\s*LINE STORE\s*$/i, "")
    .trim();
}

function getMetaImages(html: string, pageUrl: string) {
  const metaImages: string[] = [];

  const metaImagePatterns = [
    /<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["'][^>]*>/gi,
    /<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:image["'][^>]*>/gi,
    /<meta[^>]+name=["']twitter:image["'][^>]+content=["']([^"']+)["'][^>]*>/gi,
  ];

  metaImagePatterns.forEach((pattern) => {
    for (const match of html.matchAll(pattern)) {
      if (match[1]) {
        metaImages.push(match[1]);
      }
    }
  });

  return uniqueValues(
    metaImages
      .map((imageUrl) => cleanText(imageUrl))
      .map((imageUrl) => resolveImageUrl(imageUrl, pageUrl)),
  );
}

function isUsableProductImage(imageUrl: string) {
  const lowerImageUrl = imageUrl.toLowerCase();

  const looksLikeImage =
    lowerImageUrl.includes(".png") ||
    lowerImageUrl.includes(".jpg") ||
    lowerImageUrl.includes(".jpeg") ||
    lowerImageUrl.includes(".webp") ||
    lowerImageUrl.includes("stickershop") ||
    lowerImageUrl.includes("themeshop") ||
    lowerImageUrl.includes("line-scdn.net") ||
    lowerImageUrl.includes("shop.line-scdn.net");

  const isTooSmallIcon =
    lowerImageUrl.includes("favicon") ||
    lowerImageUrl.includes("apple-touch-icon") ||
    lowerImageUrl.includes("/profile") ||
    lowerImageUrl.includes("/avatar");

  return looksLikeImage && !isTooSmallIcon;
}

function getStickerIdsFromHtml(html: string) {
  const stickerIds: string[] = [];

  const patterns = [
    /\/sticker\/(\d+)\//gi,
    /"stickerId"\s*:\s*"?(\d+)"?/gi,
    /"id"\s*:\s*"?(\d{6,})"?\s*,\s*"stickerResourceType"/gi,
    /stickershop\/v1\/sticker\/(\d+)/gi,
  ];

  patterns.forEach((pattern) => {
    for (const match of html.matchAll(pattern)) {
      if (match[1]) {
        stickerIds.push(match[1]);
      }
    }
  });

  return uniqueValues(stickerIds).slice(0, 60);
}

function getStickerPreviewImagesFromIds(stickerIds: string[]) {
  return stickerIds.map(
    (stickerId) =>
      `https://stickershop.line-scdn.net/stickershop/v1/sticker/${stickerId}/android/sticker.png`,
  );
}

function getStickerCoverImage(productId: string) {
  return productId
    ? `https://stickershop.line-scdn.net/stickershop/v1/product/${productId}/LINEStorePC/main.png`
    : "";
}

function getThemeCoverCandidates(productId: string) {
  if (!productId) return [];

  const basePath = `https://shop.line-scdn.net/themeshop/v1/products/${productId}/WEBSTORE/`;

  return [
    `${basePath}icon_198x278.png`,
    `${basePath}icon_112x156.png`,
    `${basePath}icon.png`,
    `${basePath}main.png`,
    `${basePath}main_198x278.png`,
    `${basePath}main_112x156.png`,
  ];
}

async function imageExists(imageUrl: string) {
  try {
    const response = await fetch(imageUrl, {
      method: "HEAD",
      cache: "no-store",
    });

    if (!response.ok) {
      return false;
    }

    const contentType = response.headers.get("content-type") ?? "";
    return contentType.startsWith("image/");
  } catch {
    return false;
  }
}

async function getFirstExistingImage(imageUrls: string[]) {
  for (const imageUrl of imageUrls) {
    if (await imageExists(imageUrl)) {
      return imageUrl;
    }
  }

  return "";
}

async function getSafeImages(html: string, pageUrl: string) {
  const category = getCategoryFromUrl(pageUrl);
  const productId = getProductId(pageUrl);
  const metaImages = getMetaImages(html, pageUrl).filter(isUsableProductImage);

  if (category === "Theme") {
    /*
      แนวทางเสถียร:
      ธีม LINE ให้ดึงเฉพาะรูปหลักอัตโนมัติ
      ส่วนรูปพรีวิวธีม 4 รูปให้แอดมินอัปโหลดเอง เพราะ LINE ไม่ส่ง preview
      แบบเดียวกับสติกเกอร์ใน HTML เสมอ
    */
    const themeCover =
      (await getFirstExistingImage(getThemeCoverCandidates(productId))) ||
      metaImages[0] ||
      "";

    return themeCover ? [themeCover] : [];
  }

  if (category === "Sticker") {
    const stickerIds = getStickerIdsFromHtml(html);
    const stickerPreviewImages = getStickerPreviewImagesFromIds(stickerIds);
    const coverImage = getStickerCoverImage(productId);

    const images = uniqueValues([
      coverImage,
      ...stickerPreviewImages,
      ...metaImages,
    ]).filter(isUsableProductImage);

    if (images.length > 0) {
      return images.slice(0, 60);
    }
  }

  return metaImages.slice(0, 5);
}

export async function GET(request: NextRequest) {
  const url = request.nextUrl.searchParams.get("url")?.trim();

  if (!url) {
    return NextResponse.json(
      { error: "กรุณาระบุลิงก์ LINE Store" },
      { status: 400 },
    );
  }

  let parsedUrl: URL;

  try {
    parsedUrl = new URL(url);
  } catch {
    return NextResponse.json(
      { error: "รูปแบบลิงก์ไม่ถูกต้อง" },
      { status: 400 },
    );
  }

  const allowedHosts = [
    "store.line.me",
    "line.me",
    "www.line.me",
    "creator.line.me",
    "liff.line.me",
  ];

  const isAllowedHost =
    allowedHosts.includes(parsedUrl.hostname) ||
    parsedUrl.hostname.endsWith(".line.me");

  if (!isAllowedHost) {
    return NextResponse.json(
      { error: "รองรับเฉพาะลิงก์ LINE Store หรือ LINE เท่านั้น" },
      { status: 400 },
    );
  }

  const normalizedUrl = normalizeLineStoreUrl(parsedUrl.toString());

  try {
    const response = await fetch(normalizedUrl, {
      headers: {
        "user-agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome Safari",
        accept:
          "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
        "accept-language": "th-TH,th;q=0.9,en-US;q=0.8,en;q=0.7",
      },
      redirect: "follow",
      cache: "no-store",
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: "ไม่สามารถโหลดข้อมูลจาก LINE Store ได้" },
        { status: 502 },
      );
    }

    const html = await response.text();
    const title = getTitle(html);
    const images = await getSafeImages(html, normalizedUrl);
    const category = getCategoryFromUrl(normalizedUrl);

    const coverImage = images[0] ?? "";

    const previewImages =
      category === "Theme"
        ? []
        : images.filter((imageUrl) => imageUrl !== coverImage);

    const result: LineStorePreviewResponse = {
      title,
      category,
      coverImage,
      previewImages,
    };

    if (!result.title && !result.coverImage && result.previewImages.length === 0) {
      return NextResponse.json(
        {
          error:
            "ไม่พบข้อมูลสินค้าในลิงก์นี้ กรุณาลองลิงก์ LINE Store อื่นหรือกรอกเอง",
        },
        { status: 404 },
      );
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error("LINE Store import error", error);

    return NextResponse.json(
      { error: "ดึงข้อมูลจาก LINE Store ไม่สำเร็จ" },
      { status: 500 },
    );
  }
}
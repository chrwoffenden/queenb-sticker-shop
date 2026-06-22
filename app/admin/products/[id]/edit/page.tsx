"use client";

import {
  FormEvent,
  useEffect,
  useMemo,
  useState,
} from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

type ProductCategory = "Sticker" | "Theme";

type ProductRow = {
  id: number;
  name: string;
  category: ProductCategory;
  image: string;
  preview_images: string[];
  regular_price: number | string;
  sale_price: number | string | null;
  promotion_end: string | null;
  slug: string;
  line_store_url: string | null;
  is_best_seller: boolean;
  is_active: boolean;
};

type UploadResult = {
  publicUrl: string;
  filePath: string;
};

const STORAGE_BUCKET = "product-images";
const MAX_PREVIEW_IMAGES = 40;

function createSafeFileName(file: File) {
  const extension =
    file.name.split(".").pop()?.toLowerCase() || "png";

  return `${Date.now()}-${crypto.randomUUID()}.${extension}`;
}

function formatFileSize(bytes: number) {
  if (bytes < 1024 * 1024) {
    return `${Math.ceil(bytes / 1024)} KB`;
  }

  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function getStoragePathFromPublicUrl(url: string) {
  try {
    const parsedUrl = new URL(url);
    const marker = `/storage/v1/object/public/${STORAGE_BUCKET}/`;
    const markerIndex = parsedUrl.pathname.indexOf(marker);

    if (markerIndex === -1) {
      return null;
    }

    return decodeURIComponent(
      parsedUrl.pathname.slice(markerIndex + marker.length),
    );
  } catch {
    return null;
  }
}

export default function EditProductPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();

  const productId = Number(params.id);

  const [checkingSession, setCheckingSession] =
    useState(true);

  const [loadingProduct, setLoadingProduct] =
    useState(true);

  const [submitting, setSubmitting] =
    useState(false);

  const [deleting, setDeleting] =
    useState(false);

  const [message, setMessage] = useState("");

  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [lineStoreUrl, setLineStoreUrl] = useState("");

  const [category, setCategory] =
    useState<ProductCategory>("Sticker");

  const [regularPrice, setRegularPrice] =
    useState("");

  const [salePrice, setSalePrice] =
    useState("");

  const [promotionEnd, setPromotionEnd] =
    useState("");

  const [isBestSeller, setIsBestSeller] =
    useState(false);

  const [isActive, setIsActive] =
    useState(true);

  const [currentCoverUrl, setCurrentCoverUrl] =
    useState("");

  const [currentPreviewImages, setCurrentPreviewImages] =
    useState<string[]>([]);

  const [newCoverFile, setNewCoverFile] =
    useState<File | null>(null);

  const [newPreviewFiles, setNewPreviewFiles] =
    useState<File[]>([]);

  useEffect(() => {
    const initializePage = async () => {
      if (!Number.isInteger(productId) || productId <= 0) {
        setMessage("รหัสสินค้าไม่ถูกต้อง");
        setCheckingSession(false);
        setLoadingProduct(false);
        return;
      }

      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        router.replace("/admin/login");
        return;
      }

      setCheckingSession(false);

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
            is_best_seller,
            is_active
          `,
        )
        .eq("id", productId)
        .single();

      if (error || !data) {
        console.error("โหลดข้อมูลสินค้าไม่สำเร็จ", error);
        setMessage("ไม่พบสินค้าหรือโหลดข้อมูลไม่สำเร็จ");
        setLoadingProduct(false);
        return;
      }

      const product = data as ProductRow;

      setName(product.name);
      setSlug(product.slug);
      setLineStoreUrl(product.line_store_url ?? "");
      setCategory(product.category);
      setRegularPrice(String(product.regular_price));
      setSalePrice(
        product.sale_price === null
          ? ""
          : String(product.sale_price),
      );
      setPromotionEnd(product.promotion_end ?? "");
      setIsBestSeller(product.is_best_seller);
      setIsActive(product.is_active);
      setCurrentCoverUrl(product.image);
      setCurrentPreviewImages(
        (product.preview_images ?? [])
          .filter(
            (imageUrl) =>
              imageUrl !== product.image,
          )
          .slice(0, MAX_PREVIEW_IMAGES),
      );

      setLoadingProduct(false);
    };

    initializePage();
  }, [productId, router]);

  const newCoverPreviewUrl = useMemo(() => {
    if (!newCoverFile) return "";

    return URL.createObjectURL(newCoverFile);
  }, [newCoverFile]);

  const newPreviewImageUrls = useMemo(() => {
    return newPreviewFiles.map((file) =>
      URL.createObjectURL(file),
    );
  }, [newPreviewFiles]);

  useEffect(() => {
    return () => {
      if (newCoverPreviewUrl) {
        URL.revokeObjectURL(newCoverPreviewUrl);
      }

      newPreviewImageUrls.forEach((url) =>
        URL.revokeObjectURL(url),
      );
    };
  }, [newCoverPreviewUrl, newPreviewImageUrls]);

  const uploadImage = async (
    file: File,
    folderName: string,
  ): Promise<UploadResult> => {
    const safeFileName = createSafeFileName(file);
    const filePath = `${folderName}/${safeFileName}`;

    const { error: uploadError } =
      await supabase.storage
        .from(STORAGE_BUCKET)
        .upload(filePath, file, {
          cacheControl: "3600",
          upsert: false,
          contentType: file.type,
        });

    if (uploadError) {
      throw uploadError;
    }

    const { data } = supabase.storage
      .from(STORAGE_BUCKET)
      .getPublicUrl(filePath);

    return {
      publicUrl: data.publicUrl,
      filePath,
    };
  };

  const removeUploadedFiles = async (
    filePaths: string[],
  ) => {
    if (filePaths.length === 0) return;

    const { error } = await supabase.storage
      .from(STORAGE_BUCKET)
      .remove(filePaths);

    if (error) {
      console.error("ลบไฟล์ไม่สำเร็จ", error);
    }
  };

  const validateForm = () => {
    if (!name.trim()) {
      return "กรุณากรอกชื่อสินค้า";
    }

    if (!slug.trim()) {
      return "กรุณากรอก slug";
    }

    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug.trim())) {
      return "Slug ใช้ได้เฉพาะตัวอักษรอังกฤษพิมพ์เล็ก ตัวเลข และเครื่องหมาย -";
    }

    const regularPriceNumber = Number(regularPrice);

    if (
      !regularPrice ||
      Number.isNaN(regularPriceNumber) ||
      regularPriceNumber < 0
    ) {
      return "กรุณากรอกราคาปกติให้ถูกต้อง";
    }

    if (salePrice) {
      const salePriceNumber = Number(salePrice);

      if (
        Number.isNaN(salePriceNumber) ||
        salePriceNumber < 0
      ) {
        return "กรุณากรอกราคาโปรโมชั่นให้ถูกต้อง";
      }

      if (salePriceNumber >= regularPriceNumber) {
        return "ราคาโปรโมชั่นควรต่ำกว่าราคาปกติ";
      }

      if (!promotionEnd) {
        return "กรุณาเลือกวันหมดโปรโมชั่น";
      }
    }

    if (lineStoreUrl.trim()) {
      try {
        const url = new URL(lineStoreUrl.trim());

        const allowedHosts = [
          "store.line.me",
          "line.me",
          "www.line.me",
          "creator.line.me",
          "liff.line.me",
        ];

        const isAllowedHost =
          allowedHosts.includes(url.hostname) ||
          url.hostname.endsWith(".line.me");

        if (!isAllowedHost) {
          return "กรุณาใส่ลิงก์จาก LINE Store หรือแอป LINE";
        }
      } catch {
        return "รูปแบบลิงก์ LINE ไม่ถูกต้อง";
      }
    }

    const allNewFiles = [
      ...(newCoverFile ? [newCoverFile] : []),
      ...newPreviewFiles,
    ];

    const invalidFile = allNewFiles.find(
      (file) =>
        ![
          "image/png",
          "image/jpeg",
          "image/webp",
        ].includes(file.type),
    );

    if (invalidFile) {
      return "รองรับเฉพาะไฟล์ PNG, JPG, JPEG และ WEBP";
    }

    const oversizedFile = allNewFiles.find(
      (file) => file.size > 10 * 1024 * 1024,
    );

    if (oversizedFile) {
      return `ไฟล์ ${oversizedFile.name} มีขนาดเกิน 10 MB`;
    }

    if (
      !currentCoverUrl &&
      !newCoverFile
    ) {
      return "กรุณาเลือกรูปปกสินค้า";
    }

    if (
      currentPreviewImages.length +
        newPreviewFiles.length >
      MAX_PREVIEW_IMAGES
    ) {
      return `รูปพรีวิวรวมต้องไม่เกิน ${MAX_PREVIEW_IMAGES} รูป`;
    }

    return "";
  };

  const handleSubmit = async (
    event: FormEvent<HTMLFormElement>,
  ) => {
    event.preventDefault();

    const validationMessage = validateForm();

    if (validationMessage) {
      setMessage(validationMessage);
      return;
    }

    setSubmitting(true);
    setMessage("");

    const cleanSlug = slug.trim();

    const newUploadedPaths: string[] = [];
    const oldPathsToDelete: string[] = [];

    try {
      const { data: duplicateSlug } =
        await supabase
          .from("products")
          .select("id")
          .eq("slug", cleanSlug)
          .neq("id", productId)
          .maybeSingle();

      if (duplicateSlug) {
        setMessage(
          "Slug นี้มีสินค้าอื่นใช้งานแล้ว กรุณาเปลี่ยน slug",
        );
        setSubmitting(false);
        return;
      }

      let finalCoverUrl = currentCoverUrl;

      if (newCoverFile) {
        const coverUpload = await uploadImage(
          newCoverFile,
          cleanSlug,
        );

        finalCoverUrl = coverUpload.publicUrl;
        newUploadedPaths.push(coverUpload.filePath);

        const oldCoverPath =
          getStoragePathFromPublicUrl(currentCoverUrl);

        if (oldCoverPath) {
          oldPathsToDelete.push(oldCoverPath);
        }
      }

      const newPreviewUploads =
        await Promise.all(
          newPreviewFiles.map((file) =>
            uploadImage(file, cleanSlug),
          ),
        );

      newPreviewUploads.forEach((upload) => {
        newUploadedPaths.push(upload.filePath);
      });

      const additionalPreviewImages = [
        ...currentPreviewImages,
        ...newPreviewUploads.map(
          (upload) => upload.publicUrl,
        ),
      ].slice(0, MAX_PREVIEW_IMAGES);

      const uniquePreviewImages = Array.from(
        new Set([
          finalCoverUrl,
          ...additionalPreviewImages,
        ]),
      );

      const { error: updateError } =
        await supabase
          .from("products")
          .update({
            name: name.trim(),
            category,
            image: finalCoverUrl,
            preview_images: uniquePreviewImages,
            regular_price: Number(regularPrice),
            sale_price: salePrice
              ? Number(salePrice)
              : null,
            promotion_end: salePrice
              ? promotionEnd
              : null,
            slug: cleanSlug,
            line_store_url:
              lineStoreUrl.trim() || null,
            is_best_seller: isBestSeller,
            is_active: isActive,
            updated_at: new Date().toISOString(),
          })
          .eq("id", productId);

      if (updateError) {
        throw updateError;
      }

      await removeUploadedFiles(oldPathsToDelete);

      router.replace("/admin/products");
      router.refresh();
    } catch (error) {
      console.error("แก้ไขสินค้าไม่สำเร็จ", error);

      await removeUploadedFiles(newUploadedPaths);

      setMessage(
        "แก้ไขสินค้าไม่สำเร็จ กรุณาตรวจสอบข้อมูลและลองใหม่",
      );

      setSubmitting(false);
    }
  };

  const removeCurrentPreviewImage = (
    imageUrl: string,
  ) => {
    setCurrentPreviewImages((currentImages) =>
      currentImages.filter(
        (url) => url !== imageUrl,
      ),
    );

    setMessage("");
  };

  const handleDeleteProduct = async () => {
    const confirmed = window.confirm(
      "ต้องการลบสินค้านี้ใช่ไหม? ข้อมูลสินค้าและรูปใน Storage จะถูกลบ",
    );

    if (!confirmed) return;

    setDeleting(true);
    setMessage("");

    try {
      const imageUrls = Array.from(
        new Set([
          currentCoverUrl,
          ...currentPreviewImages,
        ]),
      );

      const storagePaths = imageUrls
        .map(getStoragePathFromPublicUrl)
        .filter(
          (path): path is string =>
            Boolean(path),
        );

      const { error: deleteError } =
        await supabase
          .from("products")
          .delete()
          .eq("id", productId);

      if (deleteError) {
        throw deleteError;
      }

      await removeUploadedFiles(storagePaths);

      router.replace("/admin/products");
      router.refresh();
    } catch (error) {
      console.error("ลบสินค้าไม่สำเร็จ", error);
      setMessage(
        "ลบสินค้าไม่สำเร็จ กรุณาลองใหม่อีกครั้ง",
      );
      setDeleting(false);
    }
  };

  if (checkingSession || loadingProduct) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#fff8f5] px-4">
        <p className="text-sm text-gray-500">
          กำลังโหลดข้อมูลสินค้า...
        </p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#fff8f5]">
      <header className="border-b border-pink-100 bg-white">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-4 py-4">
          <div>
            <p className="text-sm font-semibold text-[#df6f91]">
              queenb.sticker
            </p>

            <h1 className="text-xl font-bold text-[#4f4144]">
              แก้ไขสินค้า
            </h1>
          </div>

          <button
            type="button"
            onClick={() =>
              router.push("/admin/products")
            }
            className="rounded-2xl border border-gray-200 px-4 py-2 text-sm font-medium text-gray-600 transition hover:bg-gray-50"
          >
            ← กลับ
          </button>
        </div>
      </header>

      <section className="mx-auto max-w-5xl px-4 py-8">
        <form
          onSubmit={handleSubmit}
          className="grid gap-6 lg:grid-cols-[1fr_360px]"
        >
          <div className="space-y-6">
            <section className="rounded-[28px] border border-pink-100 bg-white p-5 shadow-sm md:p-6">
              <h2 className="text-lg font-bold text-[#4f4144]">
                ข้อมูลสินค้า
              </h2>

              <div className="mt-5 grid gap-5 md:grid-cols-2">
                <div className="md:col-span-2">
                  <label className="text-sm font-semibold text-[#5c4a50]">
                    ชื่อสินค้า *
                  </label>

                  <input
                    type="text"
                    value={name}
                    onChange={(event) => {
                      setName(event.target.value);
                      setMessage("");
                    }}
                    className="mt-2 w-full rounded-2xl border border-pink-100 px-4 py-3 outline-none transition focus:border-[#df7796] focus:ring-2 focus:ring-pink-100"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="text-sm font-semibold text-[#5c4a50]">
                    Slug *
                  </label>

                  <input
                    type="text"
                    value={slug}
                    onChange={(event) => {
                      setSlug(
                        event.target.value
                          .toLowerCase()
                          .replace(/\s+/g, "-"),
                      );

                      setMessage("");
                    }}
                    className="mt-2 w-full rounded-2xl border border-pink-100 px-4 py-3 outline-none transition focus:border-[#df7796] focus:ring-2 focus:ring-pink-100"
                  />

                  <p className="mt-2 text-xs text-gray-500">
                    ใช้ภาษาอังกฤษพิมพ์เล็ก ตัวเลข และเครื่องหมาย - เท่านั้น
                  </p>
                </div>

                <div className="md:col-span-2">
                  <label className="text-sm font-semibold text-[#5c4a50]">
                    ลิงก์สินค้าใน LINE Store
                  </label>

                  <input
                    type="url"
                    value={lineStoreUrl}
                    onChange={(event) => {
                      setLineStoreUrl(
                        event.target.value,
                      );
                      setMessage("");
                    }}
                    placeholder="วางลิงก์จาก LINE Store หรือแอป LINE"
                    className="mt-2 w-full rounded-2xl border border-pink-100 px-4 py-3 outline-none transition focus:border-[#df7796] focus:ring-2 focus:ring-pink-100"
                  />
                </div>

                <div>
                  <label className="text-sm font-semibold text-[#5c4a50]">
                    ประเภทสินค้า *
                  </label>

                  <select
                    value={category}
                    onChange={(event) =>
                      setCategory(
                        event.target
                          .value as ProductCategory,
                      )
                    }
                    className="mt-2 w-full rounded-2xl border border-pink-100 bg-white px-4 py-3 outline-none"
                  >
                    <option value="Sticker">
                      LINE Sticker
                    </option>

                    <option value="Theme">
                      LINE Theme
                    </option>
                  </select>
                </div>

                <div>
                  <label className="text-sm font-semibold text-[#5c4a50]">
                    ราคาปกติ *
                  </label>

                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={regularPrice}
                    onChange={(event) => {
                      setRegularPrice(
                        event.target.value,
                      );
                      setMessage("");
                    }}
                    className="mt-2 w-full rounded-2xl border border-pink-100 px-4 py-3 outline-none"
                  />
                </div>

                <div>
                  <label className="text-sm font-semibold text-[#5c4a50]">
                    ราคาโปรโมชั่น
                  </label>

                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={salePrice}
                    onChange={(event) => {
                      setSalePrice(
                        event.target.value,
                      );

                      if (!event.target.value) {
                        setPromotionEnd("");
                      }

                      setMessage("");
                    }}
                    className="mt-2 w-full rounded-2xl border border-pink-100 px-4 py-3 outline-none"
                  />
                </div>

                <div>
                  <label className="text-sm font-semibold text-[#5c4a50]">
                    วันหมดโปรโมชั่น
                  </label>

                  <input
                    type="date"
                    value={promotionEnd}
                    disabled={!salePrice}
                    onChange={(event) => {
                      setPromotionEnd(
                        event.target.value,
                      );
                      setMessage("");
                    }}
                    className="mt-2 w-full rounded-2xl border border-pink-100 px-4 py-3 outline-none disabled:bg-gray-50"
                  />
                </div>
              </div>
            </section>

            <section className="rounded-[28px] border border-pink-100 bg-white p-5 shadow-sm md:p-6">
              <h2 className="text-lg font-bold text-[#4f4144]">
                รูปสินค้า
              </h2>

              <div className="mt-5">
                <p className="text-sm font-semibold text-[#5c4a50]">
                  รูปปกปัจจุบัน
                </p>

                <img
                  src={
                    newCoverPreviewUrl ||
                    currentCoverUrl
                  }
                  alt="รูปปกสินค้า"
                  className="mt-3 h-40 w-40 rounded-2xl object-cover"
                />

                <input
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  onChange={(event) => {
                    setNewCoverFile(
                      event.target.files?.[0] ??
                        null,
                    );
                    setMessage("");
                  }}
                  className="mt-4 block w-full rounded-2xl border border-dashed border-pink-200 bg-[#fff9fb] p-4 text-sm text-gray-500 file:mr-4 file:rounded-full file:border-0 file:bg-[#ffe1eb] file:px-4 file:py-2 file:font-semibold file:text-[#d65f84]"
                />

                {newCoverFile && (
                  <div className="mt-3 flex items-center justify-between rounded-2xl bg-[#fff8fa] p-3">
                    <div>
                      <p className="text-sm font-semibold">
                        {newCoverFile.name}
                      </p>

                      <p className="mt-1 text-xs text-gray-500">
                        {formatFileSize(
                          newCoverFile.size,
                        )}
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() =>
                        setNewCoverFile(null)
                      }
                      className="rounded-full bg-red-50 px-3 py-1.5 text-xs text-red-500"
                    >
                      ยกเลิก
                    </button>
                  </div>
                )}
              </div>

              <div className="mt-7">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm font-semibold text-[#5c4a50]">
                    รูปพรีวิวปัจจุบัน
                  </p>

                  <span className="text-xs font-semibold text-[#d47691]">
                    {currentPreviewImages.length +
                      newPreviewFiles.length}{" "}
                    / {MAX_PREVIEW_IMAGES} รูป
                  </span>
                </div>

                {currentPreviewImages.length === 0 ? (
                  <div className="mt-3 rounded-2xl bg-[#fff8fa] p-4 text-sm text-gray-500">
                    ยังไม่มีรูปพรีวิวเพิ่มเติม
                  </div>
                ) : (
                <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3">
                  {currentPreviewImages.map(
                    (imageUrl, index) => (
                      <div
                        key={`${imageUrl}-${index}`}
                        className="rounded-2xl bg-[#fff8fa] p-3"
                      >
                        <img
                          src={imageUrl}
                          alt={`รูปตัวอย่าง ${index + 1}`}
                          className="aspect-square w-full rounded-xl object-cover"
                        />

                        <button
                          type="button"
                          onClick={() =>
                            removeCurrentPreviewImage(
                              imageUrl,
                            )
                          }
                          className="mt-2 w-full rounded-xl bg-red-50 px-3 py-2 text-xs text-red-500"
                        >
                          ลบรูปนี้
                        </button>
                      </div>
                    ),
                  )}
                </div>
                )}
              </div>

              <div className="mt-7">
                <p className="text-sm font-semibold text-[#5c4a50]">
                  เพิ่มรูปพรีวิวใหม่
                </p>

                <p className="mt-2 text-xs leading-5 text-gray-500">
                  เพิ่มรูปพรีวิวได้สูงสุด 2 รูป ไม่รวมรูปปก
                  ตอนนี้เพิ่มได้อีก{" "}
                  {Math.max(
                    0,
                    MAX_PREVIEW_IMAGES -
                      currentPreviewImages.length,
                  )}{" "}
                  รูป
                </p>

                <input
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  multiple
                  disabled={
                    currentPreviewImages.length >=
                    MAX_PREVIEW_IMAGES
                  }
                  onChange={(event) => {
                    const selectedFiles =
                      Array.from(
                        event.target.files ?? [],
                      );

                    const remainingSlots =
                      MAX_PREVIEW_IMAGES -
                      currentPreviewImages.length;

                    if (remainingSlots <= 0) {
                      setNewPreviewFiles([]);
                      setMessage(
                        "มีรูปพรีวิวครบ 2 รูปแล้ว กรุณาลบรูปเดิมก่อนเพิ่มรูปใหม่",
                      );
                      event.target.value = "";
                      return;
                    }

                    if (
                      selectedFiles.length >
                      remainingSlots
                    ) {
                      setNewPreviewFiles(
                        selectedFiles.slice(
                          0,
                          remainingSlots,
                        ),
                      );
                      setMessage(
                        `เพิ่มได้อีก ${remainingSlots} รูป ระบบเก็บไว้เฉพาะรูปแรกตามจำนวนที่เหลือ`,
                      );
                      event.target.value = "";
                      return;
                    }

                    setNewPreviewFiles(
                      selectedFiles,
                    );
                    setMessage("");
                  }}
                  className="mt-3 block w-full rounded-2xl border border-dashed border-pink-200 bg-[#fff9fb] p-4 text-sm text-gray-500 disabled:cursor-not-allowed disabled:bg-gray-50 file:mr-4 file:rounded-full file:border-0 file:bg-[#ffe1eb] file:px-4 file:py-2 file:font-semibold file:text-[#d65f84]"
                />

                {newPreviewFiles.length > 0 && (
                  <div className="mt-4 grid grid-cols-3 gap-3 sm:grid-cols-4 lg:grid-cols-5">
                    {newPreviewFiles.map(
                      (file, index) => (
                        <div
                          key={`${file.name}-${index}`}
                          className="rounded-2xl bg-[#fff8fa] p-3"
                        >
                          <img
                            src={
                              newPreviewImageUrls[
                                index
                              ]
                            }
                            alt={`รูปใหม่ ${index + 1}`}
                            className="aspect-square w-full rounded-xl object-cover"
                          />

                          <button
                            type="button"
                            onClick={() =>
                              setNewPreviewFiles(
                                (currentFiles) =>
                                  currentFiles.filter(
                                    (
                                      _,
                                      fileIndex,
                                    ) =>
                                      fileIndex !==
                                      index,
                                  ),
                              )
                            }
                            className="mt-2 w-full rounded-xl bg-red-50 px-3 py-2 text-xs text-red-500"
                          >
                            ลบรูป
                          </button>
                        </div>
                      ),
                    )}
                  </div>
                )}
              </div>
            </section>
          </div>

          <aside className="space-y-6 lg:sticky lg:top-6 lg:self-start">
            <section className="rounded-[28px] border border-pink-100 bg-white p-5 shadow-sm">
              <h2 className="text-lg font-bold text-[#4f4144]">
                การแสดงผล
              </h2>

              <label className="mt-5 flex cursor-pointer items-center justify-between gap-4 rounded-2xl bg-[#fff8fa] p-4">
                <div>
                  <p className="font-semibold">
                    Best Seller
                  </p>

                  <p className="mt-1 text-xs text-gray-500">
                    แสดงสินค้าในส่วนสินค้าขายดี
                  </p>
                </div>

                <input
                  type="checkbox"
                  checked={isBestSeller}
                  onChange={(event) =>
                    setIsBestSeller(
                      event.target.checked,
                    )
                  }
                  className="h-5 w-5 accent-[#df6f91]"
                />
              </label>

              <label className="mt-3 flex cursor-pointer items-center justify-between gap-4 rounded-2xl bg-[#fff8fa] p-4">
                <div>
                  <p className="font-semibold">
                    แสดงสินค้า
                  </p>

                  <p className="mt-1 text-xs text-gray-500">
                    เปิดให้ลูกค้าเห็นสินค้านี้
                  </p>
                </div>

                <input
                  type="checkbox"
                  checked={isActive}
                  onChange={(event) =>
                    setIsActive(
                      event.target.checked,
                    )
                  }
                  className="h-5 w-5 accent-[#df6f91]"
                />
              </label>
            </section>

            {message && (
              <div className="rounded-2xl bg-red-50 px-4 py-3 text-sm leading-6 text-red-600">
                {message}
              </div>
            )}

            <button
              type="submit"
              disabled={submitting || deleting}
              className="w-full rounded-2xl bg-[#df6f91] px-5 py-4 font-semibold text-white transition hover:bg-[#d35d82] disabled:opacity-60"
            >
              {submitting
                ? "กำลังบันทึก..."
                : "บันทึกการแก้ไข"}
            </button>

            <button
              type="button"
              disabled={submitting || deleting}
              onClick={handleDeleteProduct}
              className="w-full rounded-2xl bg-red-50 px-5 py-3.5 text-sm font-semibold text-red-600 transition hover:bg-red-100 disabled:opacity-60"
            >
              {deleting
                ? "กำลังลบสินค้า..."
                : "ลบสินค้า"}
            </button>

            <button
              type="button"
              disabled={submitting || deleting}
              onClick={() =>
                router.push("/admin/products")
              }
              className="w-full rounded-2xl border border-gray-200 bg-white px-5 py-3.5 text-sm font-medium text-gray-600"
            >
              ยกเลิก
            </button>
          </aside>
        </form>
      </section>
    </main>
  );
}
"use client";

import {
  FormEvent,
  useEffect,
  useMemo,
  useState,
} from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

type ProductCategory = "Sticker" | "Theme";

type UploadResult = {
  publicUrl: string;
  filePath: string;
};

const STORAGE_BUCKET = "product-images";

function createSafeFileName(file: File) {
  const extension =
    file.name.split(".").pop()?.toLowerCase() || "png";

  return `${Date.now()}-${crypto.randomUUID()}.${extension}`;
}

function createSlugFromName(name: string) {
  const englishSlug = name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  if (englishSlug) {
    return englishSlug;
  }

  return `product-${Date.now()}`;
}

function formatFileSize(bytes: number) {
  if (bytes < 1024 * 1024) {
    return `${Math.ceil(bytes / 1024)} KB`;
  }

  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function NewProductPage() {
  const router = useRouter();

  const [checkingSession, setCheckingSession] =
    useState(true);

  const [submitting, setSubmitting] =
    useState(false);

  const [message, setMessage] = useState("");

  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [lineStoreUrl, setLineStoreUrl] = useState("");

  const [slugEdited, setSlugEdited] =
    useState(false);

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

  const [coverFile, setCoverFile] =
    useState<File | null>(null);

  const [previewFiles, setPreviewFiles] =
    useState<File[]>([]);

  useEffect(() => {
    const checkSession = async () => {
      const {
        data: { user },
        error,
      } = await supabase.auth.getUser();

      if (error || !user) {
        router.replace("/admin/login");
        return;
      }

      setCheckingSession(false);
    };

    checkSession();
  }, [router]);

  useEffect(() => {
    if (slugEdited) return;

    setSlug(createSlugFromName(name));
  }, [name, slugEdited]);

  const coverPreviewUrl = useMemo(() => {
    if (!coverFile) return "";

    return URL.createObjectURL(coverFile);
  }, [coverFile]);

  const previewImageUrls = useMemo(() => {
    return previewFiles.map((file) =>
      URL.createObjectURL(file),
    );
  }, [previewFiles]);

  useEffect(() => {
    return () => {
      if (coverPreviewUrl) {
        URL.revokeObjectURL(coverPreviewUrl);
      }

      previewImageUrls.forEach((url) =>
        URL.revokeObjectURL(url),
      );
    };
  }, [coverPreviewUrl, previewImageUrls]);

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
      console.error(
        "ลบไฟล์ที่อัปโหลดไม่สำเร็จ",
        error,
      );
    }
  };

  const validateForm = () => {
    if (!name.trim()) {
      return "กรุณากรอกชื่อสินค้า";
    }

    if (!slug.trim()) {
      return "กรุณากรอก slug";
    }

    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) {
      return "Slug ใช้ได้เฉพาะตัวอักษรอังกฤษพิมพ์เล็ก ตัวเลข และเครื่องหมาย -";
    }

    const regularPriceNumber =
      Number(regularPrice);

    if (
      !regularPrice ||
      Number.isNaN(regularPriceNumber) ||
      regularPriceNumber < 0
    ) {
      return "กรุณากรอกราคาปกติให้ถูกต้อง";
    }

    if (salePrice) {
      const salePriceNumber =
        Number(salePrice);

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

    if (!coverFile) {
      return "กรุณาเลือกรูปปกสินค้า";
    }

    const allFiles = [
      coverFile,
      ...previewFiles,
    ];

    const invalidFile = allFiles.find(
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

    const oversizedFile = allFiles.find(
      (file) =>
        file.size > 10 * 1024 * 1024,
    );

    if (oversizedFile) {
      return `ไฟล์ ${oversizedFile.name} มีขนาดเกิน 10 MB`;
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
    const uploadedPaths: string[] = [];

    try {
      const { data: existingProduct } =
        await supabase
          .from("products")
          .select("id")
          .eq("slug", cleanSlug)
          .maybeSingle();

      if (existingProduct) {
        setMessage(
          "Slug นี้มีสินค้าอื่นใช้งานแล้ว กรุณาเปลี่ยน slug",
        );
        setSubmitting(false);
        return;
      }

      const coverUpload = await uploadImage(
        coverFile!,
        cleanSlug,
      );

      uploadedPaths.push(
        coverUpload.filePath,
      );

      const previewUploads =
        await Promise.all(
          previewFiles.map((file) =>
            uploadImage(file, cleanSlug),
          ),
        );

      previewUploads.forEach((upload) => {
        uploadedPaths.push(upload.filePath);
      });

      const previewImageUrlsForDatabase = [
        coverUpload.publicUrl,
        ...previewUploads.map(
          (upload) => upload.publicUrl,
        ),
      ];

      const { error: insertError } =
        await supabase
          .from("products")
          .insert({
            name: name.trim(),
            category,
            image: coverUpload.publicUrl,
            preview_images:
              previewImageUrlsForDatabase,
            regular_price:
              Number(regularPrice),
            sale_price: salePrice
              ? Number(salePrice)
              : null,
            promotion_end: salePrice
              ? promotionEnd
              : null,
            slug: cleanSlug,
            line_store_url:
              lineStoreUrl.trim() || null,
            is_best_seller:
              isBestSeller,
            is_active: isActive,
          });

      if (insertError) {
        throw insertError;
      }

      router.replace("/admin/products");
      router.refresh();
    } catch (error) {
      console.error(
        "เพิ่มสินค้าไม่สำเร็จ",
        error,
      );

      await removeUploadedFiles(
        uploadedPaths,
      );

      setMessage(
        "เพิ่มสินค้าไม่สำเร็จ กรุณาตรวจสอบข้อมูลและลองใหม่",
      );

      setSubmitting(false);
    }
  };

  if (checkingSession) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#fff8f5] px-4">
        <p className="text-sm text-gray-500">
          กำลังตรวจสอบการเข้าสู่ระบบ...
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
              เพิ่มสินค้าใหม่
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
                  <label
                    htmlFor="name"
                    className="text-sm font-semibold text-[#5c4a50]"
                  >
                    ชื่อสินค้า *
                  </label>

                  <input
                    id="name"
                    type="text"
                    value={name}
                    onChange={(event) => {
                      setName(event.target.value);
                      setMessage("");
                    }}
                    placeholder="เช่น Berry Bunny Sticker"
                    className="mt-2 w-full rounded-2xl border border-pink-100 px-4 py-3 outline-none transition focus:border-[#df7796] focus:ring-2 focus:ring-pink-100"
                  />
                </div>

                <div className="md:col-span-2">
                  <label
                    htmlFor="slug"
                    className="text-sm font-semibold text-[#5c4a50]"
                  >
                    Slug *
                  </label>

                  <input
                    id="slug"
                    type="text"
                    value={slug}
                    onChange={(event) => {
                      setSlug(
                        event.target.value
                          .toLowerCase()
                          .replace(/\s+/g, "-"),
                      );

                      setSlugEdited(true);
                      setMessage("");
                    }}
                    placeholder="berry-bunny-sticker"
                    className="mt-2 w-full rounded-2xl border border-pink-100 px-4 py-3 outline-none transition focus:border-[#df7796] focus:ring-2 focus:ring-pink-100"
                  />

                  <p className="mt-2 text-xs text-gray-500">
                    ใช้ภาษาอังกฤษพิมพ์เล็ก ตัวเลข
                    และเครื่องหมาย - เท่านั้น
                  </p>
                </div>

                <div className="md:col-span-2">
                  <label
                    htmlFor="line-store-url"
                    className="text-sm font-semibold text-[#5c4a50]"
                  >
                    ลิงก์สินค้าใน LINE Store
                  </label>

                  <input
                    id="line-store-url"
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

                  <p className="mt-2 text-xs text-gray-500">
                    รองรับลิงก์ที่คัดลอกจาก LINE Store บนเว็บ
                    และลิงก์ที่แชร์จากแอป LINE บนมือถือ
                  </p>
                </div>

                <div>
                  <label
                    htmlFor="category"
                    className="text-sm font-semibold text-[#5c4a50]"
                  >
                    ประเภทสินค้า *
                  </label>

                  <select
                    id="category"
                    value={category}
                    onChange={(event) =>
                      setCategory(
                        event.target
                          .value as ProductCategory,
                      )
                    }
                    className="mt-2 w-full rounded-2xl border border-pink-100 bg-white px-4 py-3 outline-none transition focus:border-[#df7796] focus:ring-2 focus:ring-pink-100"
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
                  <label
                    htmlFor="regular-price"
                    className="text-sm font-semibold text-[#5c4a50]"
                  >
                    ราคาปกติ *
                  </label>

                  <input
                    id="regular-price"
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
                    placeholder="59"
                    className="mt-2 w-full rounded-2xl border border-pink-100 px-4 py-3 outline-none transition focus:border-[#df7796] focus:ring-2 focus:ring-pink-100"
                  />
                </div>

                <div>
                  <label
                    htmlFor="sale-price"
                    className="text-sm font-semibold text-[#5c4a50]"
                  >
                    ราคาโปรโมชั่น
                  </label>

                  <input
                    id="sale-price"
                    type="number"
                    min="0"
                    step="0.01"
                    value={salePrice}
                    onChange={(event) => {
                      setSalePrice(
                        event.target.value,
                      );

                      if (
                        !event.target.value
                      ) {
                        setPromotionEnd("");
                      }

                      setMessage("");
                    }}
                    placeholder="เว้นว่างหากไม่มีโปร"
                    className="mt-2 w-full rounded-2xl border border-pink-100 px-4 py-3 outline-none transition focus:border-[#df7796] focus:ring-2 focus:ring-pink-100"
                  />
                </div>

                <div>
                  <label
                    htmlFor="promotion-end"
                    className="text-sm font-semibold text-[#5c4a50]"
                  >
                    วันหมดโปรโมชั่น
                  </label>

                  <input
                    id="promotion-end"
                    type="date"
                    value={promotionEnd}
                    disabled={!salePrice}
                    onChange={(event) => {
                      setPromotionEnd(
                        event.target.value,
                      );

                      setMessage("");
                    }}
                    className="mt-2 w-full rounded-2xl border border-pink-100 px-4 py-3 outline-none transition focus:border-[#df7796] focus:ring-2 focus:ring-pink-100 disabled:cursor-not-allowed disabled:bg-gray-50 disabled:text-gray-400"
                  />
                </div>
              </div>
            </section>

            <section className="rounded-[28px] border border-pink-100 bg-white p-5 shadow-sm md:p-6">
              <h2 className="text-lg font-bold text-[#4f4144]">
                รูปสินค้า
              </h2>

              <div className="mt-5">
                <label
                  htmlFor="cover-image"
                  className="text-sm font-semibold text-[#5c4a50]"
                >
                  รูปปกสินค้า *
                </label>

                <input
                  id="cover-image"
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  onChange={(event) => {
                    setCoverFile(
                      event.target.files?.[0] ??
                        null,
                    );

                    setMessage("");
                  }}
                  className="mt-2 block w-full rounded-2xl border border-dashed border-pink-200 bg-[#fff9fb] p-4 text-sm text-gray-500 file:mr-4 file:rounded-full file:border-0 file:bg-[#ffe1eb] file:px-4 file:py-2 file:font-semibold file:text-[#d65f84]"
                />

                {coverFile && (
                  <div className="mt-4 flex items-center gap-3 rounded-2xl bg-[#fff8fa] p-3">
                    <img
                      src={coverPreviewUrl}
                      alt="ตัวอย่างรูปปก"
                      className="h-20 w-20 rounded-xl object-cover"
                    />

                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold">
                        {coverFile.name}
                      </p>

                      <p className="mt-1 text-xs text-gray-500">
                        {formatFileSize(
                          coverFile.size,
                        )}
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() =>
                        setCoverFile(null)
                      }
                      className="rounded-full bg-red-50 px-3 py-1.5 text-xs text-red-500"
                    >
                      ลบ
                    </button>
                  </div>
                )}
              </div>

              <div className="mt-6">
                <label
                  htmlFor="preview-images"
                  className="text-sm font-semibold text-[#5c4a50]"
                >
                  รูปตัวอย่างเพิ่มเติม
                </label>

                <input
                  id="preview-images"
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  multiple
                  onChange={(event) => {
                    const files =
                      Array.from(
                        event.target.files ?? [],
                      );

                    setPreviewFiles(files);
                    setMessage("");
                  }}
                  className="mt-2 block w-full rounded-2xl border border-dashed border-pink-200 bg-[#fff9fb] p-4 text-sm text-gray-500 file:mr-4 file:rounded-full file:border-0 file:bg-[#ffe1eb] file:px-4 file:py-2 file:font-semibold file:text-[#d65f84]"
                />

                <p className="mt-2 text-xs text-gray-500">
                  เลือกได้หลายรูป ระบบจะเปลี่ยนชื่อไฟล์ภาษาไทยเป็นชื่อปลอดภัยอัตโนมัติ
                </p>

                {previewFiles.length > 0 && (
                  <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
                    {previewFiles.map(
                      (file, index) => (
                        <div
                          key={`${file.name}-${index}`}
                          className="rounded-2xl bg-[#fff8fa] p-3"
                        >
                          <img
                            src={
                              previewImageUrls[
                                index
                              ]
                            }
                            alt={`รูปตัวอย่าง ${
                              index + 1
                            }`}
                            className="aspect-square w-full rounded-xl object-cover"
                          />

                          <p className="mt-2 truncate text-xs font-semibold">
                            {file.name}
                          </p>

                          <button
                            type="button"
                            onClick={() =>
                              setPreviewFiles(
                                (
                                  currentFiles,
                                ) =>
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
              disabled={submitting}
              className="w-full rounded-2xl bg-[#df6f91] px-5 py-4 font-semibold text-white shadow-sm transition hover:bg-[#d35d82] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {submitting
                ? "กำลังอัปโหลดและบันทึก..."
                : "บันทึกสินค้า"}
            </button>

            <button
              type="button"
              disabled={submitting}
              onClick={() =>
                router.push(
                  "/admin/products",
                )
              }
              className="w-full rounded-2xl border border-gray-200 bg-white px-5 py-3.5 text-sm font-medium text-gray-600 transition hover:bg-gray-50 disabled:opacity-60"
            >
              ยกเลิก
            </button>
          </aside>
        </form>
      </section>
    </main>
  );
}
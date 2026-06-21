"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

type SiteNotice = {
  id: string;
  icon: string;
  title: string;
  description: string;
  button_text: string | null;
  button_link: string | null;
  bg_color: string | null;
  border_color: string | null;
  sort_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

type NoticeForm = {
  id: string | null;
  icon: string;
  title: string;
  description: string;
  button_text: string;
  button_link: string;
  bg_color: string;
  border_color: string;
  sort_order: string;
  is_active: boolean;
};

const emptyForm: NoticeForm = {
  id: null,
  icon: "📢",
  title: "",
  description: "",
  button_text: "",
  button_link: "",
  bg_color: "#ffffff",
  border_color: "#ffe0ea",
  sort_order: "1",
  is_active: true,
};

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat("th-TH", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function normalizeOptionalText(value: string) {
  const trimmedValue = value.trim();
  return trimmedValue.length > 0 ? trimmedValue : null;
}

export default function AdminNoticesPage() {
  const router = useRouter();

  const [notices, setNotices] = useState<SiteNotice[]>([]);
  const [form, setForm] = useState<NoticeForm>(emptyForm);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const activeNoticeCount = useMemo(
    () => notices.filter((notice) => notice.is_active).length,
    [notices],
  );

  const loadNotices = useCallback(async () => {
    setLoading(true);
    setMessage("");

    const { data, error } = await supabase
      .from("site_notices")
      .select(
        `
          id,
          icon,
          title,
          description,
          button_text,
          button_link,
          bg_color,
          border_color,
          sort_order,
          is_active,
          created_at,
          updated_at
        `,
      )
      .order("sort_order", { ascending: true })
      .order("created_at", { ascending: true });

    if (error) {
      console.error("โหลดข่าวสารไม่สำเร็จ", error);
      setMessage("ไม่สามารถโหลดข่าวสารได้ กรุณาตรวจสอบตาราง site_notices");
      setLoading(false);
      return;
    }

    setNotices((data ?? []) as SiteNotice[]);
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

      await loadNotices();
    };

    initializePage();
  }, [loadNotices, router]);

  const updateForm = (
    field: keyof NoticeForm,
    value: string | boolean,
  ) => {
    setForm((currentForm) => ({
      ...currentForm,
      [field]: value,
    }));
  };

  const resetForm = () => {
    setForm(emptyForm);
    setMessage("");
  };

  const startEdit = (notice: SiteNotice) => {
    setForm({
      id: notice.id,
      icon: notice.icon ?? "📢",
      title: notice.title ?? "",
      description: notice.description ?? "",
      button_text: notice.button_text ?? "",
      button_link: notice.button_link ?? "",
      bg_color: notice.bg_color ?? "#ffffff",
      border_color: notice.border_color ?? "#ffe0ea",
      sort_order: String(notice.sort_order ?? 1),
      is_active: notice.is_active,
    });

    setMessage("กำลังแก้ไขข่าวสารที่เลือก");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const title = form.title.trim();
    const description = form.description.trim();
    const icon = form.icon.trim() || "📢";
    const sortOrder = Number(form.sort_order);

    if (!title) {
      setMessage("กรุณากรอกหัวข้อข่าวสาร");
      return;
    }

    if (!description) {
      setMessage("กรุณากรอกรายละเอียดข่าวสาร");
      return;
    }

    if (!Number.isFinite(sortOrder)) {
      setMessage("กรุณากรอกลำดับการแสดงผลเป็นตัวเลข");
      return;
    }

    setSaving(true);
    setMessage("");

    const payload = {
      icon,
      title,
      description,
      button_text: normalizeOptionalText(form.button_text),
      button_link: normalizeOptionalText(form.button_link),
      bg_color: form.bg_color.trim() || "#ffffff",
      border_color: form.border_color.trim() || "#ffe0ea",
      sort_order: sortOrder,
      is_active: form.is_active,
    };

    if (form.id) {
      const { error } = await supabase
        .from("site_notices")
        .update(payload)
        .eq("id", form.id);

      if (error) {
        console.error("อัปเดตข่าวสารไม่สำเร็จ", error);
        setMessage("อัปเดตข่าวสารไม่สำเร็จ");
        setSaving(false);
        return;
      }

      setMessage("บันทึกการแก้ไขข่าวสารเรียบร้อยแล้ว");
    } else {
      const { error } = await supabase
        .from("site_notices")
        .insert(payload);

      if (error) {
        console.error("เพิ่มข่าวสารไม่สำเร็จ", error);
        setMessage("เพิ่มข่าวสารไม่สำเร็จ");
        setSaving(false);
        return;
      }

      setMessage("เพิ่มข่าวสารใหม่เรียบร้อยแล้ว");
    }

    setSaving(false);
    setForm(emptyForm);
    await loadNotices();
  };

  const handleToggleActive = async (notice: SiteNotice) => {
    setUpdatingId(notice.id);
    setMessage("");

    const { error } = await supabase
      .from("site_notices")
      .update({ is_active: !notice.is_active })
      .eq("id", notice.id);

    if (error) {
      console.error("เปลี่ยนสถานะข่าวสารไม่สำเร็จ", error);
      setMessage("เปลี่ยนสถานะข่าวสารไม่สำเร็จ");
      setUpdatingId(null);
      return;
    }

    setNotices((currentNotices) =>
      currentNotices.map((currentNotice) =>
        currentNotice.id === notice.id
          ? {
              ...currentNotice,
              is_active: !currentNotice.is_active,
            }
          : currentNotice,
      ),
    );

    setUpdatingId(null);
  };

  const handleDelete = async (notice: SiteNotice) => {
    const confirmed = window.confirm(
      `ต้องการลบข่าวสาร "${notice.title}" ใช่ไหม?`,
    );

    if (!confirmed) return;

    setDeletingId(notice.id);
    setMessage("");

    const { error } = await supabase
      .from("site_notices")
      .delete()
      .eq("id", notice.id);

    if (error) {
      console.error("ลบข่าวสารไม่สำเร็จ", error);
      setMessage("ลบข่าวสารไม่สำเร็จ");
      setDeletingId(null);
      return;
    }

    setNotices((currentNotices) =>
      currentNotices.filter(
        (currentNotice) => currentNotice.id !== notice.id,
      ),
    );

    if (form.id === notice.id) {
      setForm(emptyForm);
    }

    setMessage("ลบข่าวสารเรียบร้อยแล้ว");
    setDeletingId(null);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.replace("/admin/login");
    router.refresh();
  };

  return (
    <main className="min-h-screen bg-[#fff9f5] px-4 py-5 text-[#4f4144] sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl">
        <header className="rounded-[28px] border border-[#f5d8df] bg-white/90 p-5 shadow-sm">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-2xl bg-[#fff1f5]">
                <img
                  src="/images/logo-icon.png"
                  alt="queenb.sticker"
                  className="h-full w-full object-cover"
                />
              </div>

              <div>
                <p className="text-xs font-bold uppercase tracking-[0.28em] text-[#df6f91]">
                  Admin Panel
                </p>
                <h1 className="mt-1 text-2xl font-black text-[#4f4144]">
                  จัดการข่าวสารหน้าแรก
                </h1>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => router.push("/admin")}
                className="rounded-2xl border border-[#efc9d6] bg-white px-4 py-2 text-sm font-bold text-[#d65f84] transition hover:bg-[#fff1f5]"
              >
                หน้าหลักแอดมิน
              </button>

              <button
                type="button"
                onClick={() => router.push("/admin/products")}
                className="rounded-2xl border border-[#efc9d6] bg-white px-4 py-2 text-sm font-bold text-[#d65f84] transition hover:bg-[#fff1f5]"
              >
                จัดการสินค้า
              </button>

              <button
                type="button"
                onClick={() => router.push("/")}
                className="rounded-2xl border border-[#efc9d6] bg-white px-4 py-2 text-sm font-bold text-[#d65f84] transition hover:bg-[#fff1f5]"
              >
                ดูหน้าร้าน
              </button>

              <button
                type="button"
                onClick={handleLogout}
                className="rounded-2xl bg-[#4f4144] px-4 py-2 text-sm font-bold text-white transition hover:bg-[#2f2729]"
              >
                ออกจากระบบ
              </button>
            </div>
          </div>
        </header>

        <section className="mt-5 grid gap-4 md:grid-cols-3">
          <div className="rounded-[24px] border border-[#f5d8df] bg-white p-5 shadow-sm">
            <p className="text-sm font-semibold text-[#8a7479]">
              ข่าวสารทั้งหมด
            </p>
            <p className="mt-2 text-3xl font-black text-[#4f4144]">
              {notices.length}
            </p>
          </div>

          <div className="rounded-[24px] border border-[#f5d8df] bg-white p-5 shadow-sm">
            <p className="text-sm font-semibold text-[#8a7479]">
              กำลังแสดงผล
            </p>
            <p className="mt-2 text-3xl font-black text-[#06a84f]">
              {activeNoticeCount}
            </p>
          </div>

          <div className="rounded-[24px] border border-[#f5d8df] bg-white p-5 shadow-sm">
            <p className="text-sm font-semibold text-[#8a7479]">
              ซ่อนอยู่
            </p>
            <p className="mt-2 text-3xl font-black text-[#df6f91]">
              {notices.length - activeNoticeCount}
            </p>
          </div>
        </section>

        {message && (
          <div className="mt-5 rounded-[22px] border border-[#f7dce5] bg-white px-5 py-4 text-sm font-bold text-[#d65f84] shadow-sm">
            {message}
          </div>
        )}

        <section className="mt-5 grid gap-5 lg:grid-cols-[420px_1fr]">
          <form
            onSubmit={handleSubmit}
            className="rounded-[28px] border border-[#f5d8df] bg-white p-5 shadow-sm"
          >
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-bold text-[#df6f91]">
                  {form.id ? "Edit Notice" : "New Notice"}
                </p>
                <h2 className="mt-1 text-xl font-black text-[#4f4144]">
                  {form.id ? "แก้ไขข่าวสาร" : "เพิ่มข่าวสารใหม่"}
                </h2>
              </div>

              {form.id && (
                <button
                  type="button"
                  onClick={resetForm}
                  className="rounded-full border border-[#efc9d6] px-4 py-2 text-xs font-bold text-[#d65f84] transition hover:bg-[#fff1f5]"
                >
                  ยกเลิกแก้ไข
                </button>
              )}
            </div>

            <div className="mt-5 space-y-4">
              <div>
                <label className="text-sm font-bold text-[#4f4144]">
                  ไอคอน
                </label>
                <input
                  value={form.icon}
                  onChange={(event) =>
                    updateForm("icon", event.target.value)
                  }
                  placeholder="เช่น 🎀"
                  className="mt-2 w-full rounded-2xl border border-[#f0d4dc] bg-[#fff9fb] px-4 py-3 text-sm outline-none transition focus:border-[#df6f91] focus:bg-white"
                />
              </div>

              <div>
                <label className="text-sm font-bold text-[#4f4144]">
                  หัวข้อ
                </label>
                <input
                  value={form.title}
                  onChange={(event) =>
                    updateForm("title", event.target.value)
                  }
                  placeholder="เช่น ราคาเริ่มต้นเพียง 15 บาท"
                  className="mt-2 w-full rounded-2xl border border-[#f0d4dc] bg-[#fff9fb] px-4 py-3 text-sm outline-none transition focus:border-[#df6f91] focus:bg-white"
                />
              </div>

              <div>
                <label className="text-sm font-bold text-[#4f4144]">
                  รายละเอียด
                </label>
                <textarea
                  value={form.description}
                  onChange={(event) =>
                    updateForm("description", event.target.value)
                  }
                  rows={4}
                  placeholder="เช่น รวมสติกเกอร์และธีม LINE น่ารัก ๆ ราคาสบายกระเป๋า"
                  className="mt-2 w-full resize-none rounded-2xl border border-[#f0d4dc] bg-[#fff9fb] px-4 py-3 text-sm leading-6 outline-none transition focus:border-[#df6f91] focus:bg-white"
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="text-sm font-bold text-[#4f4144]">
                    ข้อความปุ่ม
                  </label>
                  <input
                    value={form.button_text}
                    onChange={(event) =>
                      updateForm("button_text", event.target.value)
                    }
                    placeholder="เช่น ดูโปรโมชัน"
                    className="mt-2 w-full rounded-2xl border border-[#f0d4dc] bg-[#fff9fb] px-4 py-3 text-sm outline-none transition focus:border-[#df6f91] focus:bg-white"
                  />
                </div>

                <div>
                  <label className="text-sm font-bold text-[#4f4144]">
                    ลิงก์ปุ่ม
                  </label>
                  <input
                    value={form.button_link}
                    onChange={(event) =>
                      updateForm("button_link", event.target.value)
                    }
                    placeholder="เช่น /promotions"
                    className="mt-2 w-full rounded-2xl border border-[#f0d4dc] bg-[#fff9fb] px-4 py-3 text-sm outline-none transition focus:border-[#df6f91] focus:bg-white"
                  />
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="text-sm font-bold text-[#4f4144]">
                    สีพื้นหลัง
                  </label>
                  <input
                    value={form.bg_color}
                    onChange={(event) =>
                      updateForm("bg_color", event.target.value)
                    }
                    placeholder="#ffffff"
                    className="mt-2 w-full rounded-2xl border border-[#f0d4dc] bg-[#fff9fb] px-4 py-3 text-sm outline-none transition focus:border-[#df6f91] focus:bg-white"
                  />
                </div>

                <div>
                  <label className="text-sm font-bold text-[#4f4144]">
                    สีเส้นขอบ
                  </label>
                  <input
                    value={form.border_color}
                    onChange={(event) =>
                      updateForm("border_color", event.target.value)
                    }
                    placeholder="#ffe0ea"
                    className="mt-2 w-full rounded-2xl border border-[#f0d4dc] bg-[#fff9fb] px-4 py-3 text-sm outline-none transition focus:border-[#df6f91] focus:bg-white"
                  />
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="text-sm font-bold text-[#4f4144]">
                    ลำดับการแสดงผล
                  </label>
                  <input
                    value={form.sort_order}
                    onChange={(event) =>
                      updateForm("sort_order", event.target.value)
                    }
                    inputMode="numeric"
                    placeholder="1"
                    className="mt-2 w-full rounded-2xl border border-[#f0d4dc] bg-[#fff9fb] px-4 py-3 text-sm outline-none transition focus:border-[#df6f91] focus:bg-white"
                  />
                </div>

                <label className="mt-7 flex items-center justify-between rounded-2xl border border-[#f0d4dc] bg-[#fff9fb] px-4 py-3">
                  <span className="text-sm font-bold text-[#4f4144]">
                    เปิดแสดงผล
                  </span>
                  <input
                    type="checkbox"
                    checked={form.is_active}
                    onChange={(event) =>
                      updateForm("is_active", event.target.checked)
                    }
                    className="h-5 w-5 accent-[#df6f91]"
                  />
                </label>
              </div>

              <button
                type="submit"
                disabled={saving}
                className="w-full rounded-2xl bg-[#df6f91] px-5 py-3 text-sm font-black text-white shadow-sm transition hover:bg-[#d35d82] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {saving
                  ? "กำลังบันทึก..."
                  : form.id
                    ? "บันทึกการแก้ไข"
                    : "เพิ่มข่าวสาร"}
              </button>
            </div>
          </form>

          <section className="rounded-[28px] border border-[#f5d8df] bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-bold text-[#df6f91]">
                  Notice List
                </p>
                <h2 className="mt-1 text-xl font-black text-[#4f4144]">
                  ข่าวสารทั้งหมด
                </h2>
              </div>

              <button
                type="button"
                onClick={loadNotices}
                className="rounded-2xl border border-[#efc9d6] bg-white px-4 py-2 text-sm font-bold text-[#d65f84] transition hover:bg-[#fff1f5]"
              >
                รีเฟรช
              </button>
            </div>

            {loading ? (
              <div className="mt-6 rounded-[24px] bg-[#fff9f5] p-8 text-center text-sm font-bold text-[#8a7479]">
                กำลังโหลดข่าวสาร...
              </div>
            ) : notices.length === 0 ? (
              <div className="mt-6 rounded-[24px] bg-[#fff9f5] p-8 text-center text-sm leading-7 text-[#8a7479]">
                ยังไม่มีข่าวสารหน้าแรก
                <br />
                เพิ่มข่าวสารใหม่จากฟอร์มด้านซ้ายได้เลยค่ะ
              </div>
            ) : (
              <div className="mt-5 space-y-4">
                {notices.map((notice) => (
                  <article
                    key={notice.id}
                    className="rounded-[24px] border bg-white p-4 shadow-sm"
                    style={{
                      borderColor: notice.border_color ?? "#ffe0ea",
                      backgroundColor: notice.bg_color ?? "#ffffff",
                    }}
                  >
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                      <div className="flex gap-3">
                        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white/80 text-2xl shadow-sm">
                          {notice.icon}
                        </div>

                        <div>
                          <div className="flex flex-wrap items-center gap-2">
                            <h3 className="text-base font-black text-[#4f4144]">
                              {notice.title}
                            </h3>

                            <span
                              className={
                                notice.is_active
                                  ? "rounded-full bg-[#eafaf0] px-3 py-1 text-xs font-bold text-[#06a84f]"
                                  : "rounded-full bg-[#f4f0f1] px-3 py-1 text-xs font-bold text-[#8a7479]"
                              }
                            >
                              {notice.is_active ? "แสดงผล" : "ซ่อนอยู่"}
                            </span>

                            <span className="rounded-full bg-white/80 px-3 py-1 text-xs font-bold text-[#8a7479]">
                              ลำดับ {notice.sort_order}
                            </span>
                          </div>

                          <p className="mt-2 text-sm leading-6 text-[#806f73]">
                            {notice.description}
                          </p>

                          {(notice.button_text || notice.button_link) && (
                            <p className="mt-2 text-xs font-bold text-[#d65f84]">
                              ปุ่ม: {notice.button_text || "-"} →{" "}
                              {notice.button_link || "-"}
                            </p>
                          )}

                          <p className="mt-2 text-xs text-[#9b8b8f]">
                            แก้ไขล่าสุด {formatDateTime(notice.updated_at)}
                          </p>
                        </div>
                      </div>

                      <div className="flex shrink-0 flex-wrap gap-2 sm:justify-end">
                        <button
                          type="button"
                          onClick={() => startEdit(notice)}
                          className="rounded-xl bg-white px-3 py-2 text-xs font-bold text-[#d65f84] shadow-sm transition hover:bg-[#fff1f5]"
                        >
                          แก้ไข
                        </button>

                        <button
                          type="button"
                          onClick={() => handleToggleActive(notice)}
                          disabled={updatingId === notice.id}
                          className="rounded-xl bg-white px-3 py-2 text-xs font-bold text-[#4f4144] shadow-sm transition hover:bg-[#fff9f5] disabled:opacity-60"
                        >
                          {updatingId === notice.id
                            ? "กำลังอัปเดต..."
                            : notice.is_active
                              ? "ปิด"
                              : "เปิด"}
                        </button>

                        <button
                          type="button"
                          onClick={() => handleDelete(notice)}
                          disabled={deletingId === notice.id}
                          className="rounded-xl bg-[#4f4144] px-3 py-2 text-xs font-bold text-white shadow-sm transition hover:bg-[#2f2729] disabled:opacity-60"
                        >
                          {deletingId === notice.id
                            ? "กำลังลบ..."
                            : "ลบ"}
                        </button>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </section>
        </section>

        <div className="mt-6 rounded-[24px] border border-[#f5d8df] bg-white p-5 text-sm leading-7 text-[#806f73] shadow-sm">
          <p className="font-black text-[#4f4144]">
            หมายเหตุ
          </p>
          <p>
            ข่าวสารที่เปิดแสดงผลจะนำไปใช้กับกล่อง “แจ้งข่าวสารจากร้าน”
            บนหน้าแรก เมื่อเชื่อมหน้าแรกกับตาราง site_notices แล้ว
            ข้อความจะอัปเดตจากหลังร้านได้เลย
          </p>
        </div>
      </div>
    </main>
  );
}
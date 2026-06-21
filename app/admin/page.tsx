"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

type DashboardStats = {
  products: number;
  activeProducts: number;
  notices: number;
  activeNotices: number;
};

const initialStats: DashboardStats = {
  products: 0,
  activeProducts: 0,
  notices: 0,
  activeNotices: 0,
};

export default function AdminDashboardPage() {
  const router = useRouter();

  const [stats, setStats] = useState<DashboardStats>(initialStats);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  const loadStats = useCallback(async () => {
    setLoading(true);
    setMessage("");

    const [
      productsResult,
      activeProductsResult,
      noticesResult,
      activeNoticesResult,
    ] = await Promise.all([
      supabase
        .from("products")
        .select("id", { count: "exact", head: true }),
      supabase
        .from("products")
        .select("id", { count: "exact", head: true })
        .eq("is_active", true),
      supabase
        .from("site_notices")
        .select("id", { count: "exact", head: true }),
      supabase
        .from("site_notices")
        .select("id", { count: "exact", head: true })
        .eq("is_active", true),
    ]);

    if (
      productsResult.error ||
      activeProductsResult.error ||
      noticesResult.error ||
      activeNoticesResult.error
    ) {
      console.error("โหลดข้อมูล Dashboard ไม่สำเร็จ", {
        productsError: productsResult.error,
        activeProductsError: activeProductsResult.error,
        noticesError: noticesResult.error,
        activeNoticesError: activeNoticesResult.error,
      });

      setMessage(
        "โหลดข้อมูลบางส่วนไม่สำเร็จ กรุณาตรวจสอบตาราง products และ site_notices",
      );
    }

    setStats({
      products: productsResult.count ?? 0,
      activeProducts: activeProductsResult.count ?? 0,
      notices: noticesResult.count ?? 0,
      activeNotices: activeNoticesResult.count ?? 0,
    });

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

      await loadStats();
    };

    initializePage();
  }, [loadStats, router]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.replace("/admin/login");
    router.refresh();
  };

  return (
    <main className="min-h-screen bg-[#fff9f5] text-[#4f4144]">
      <header className="sticky top-0 z-40 border-b border-[#f7dce5] bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3.5">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center overflow-hidden rounded-2xl bg-[#fff1f5] shadow-sm">
              <img
                src="/images/logo-icon.png"
                alt="queenb.sticker"
                className="h-full w-full object-cover"
              />
            </div>

            <div>
              <p className="text-sm font-bold text-[#df6f91]">
                queenb.sticker
              </p>

              <h1 className="text-lg font-bold text-[#4f4144]">
                หน้าหลักแอดมิน
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => router.push("/")}
              className="hidden rounded-2xl border border-[#f2d5df] bg-white px-4 py-2.5 text-sm font-semibold text-[#d65f84] transition hover:bg-[#fff1f5] sm:block"
            >
              ดูหน้าร้าน
            </button>

            <button
              type="button"
              onClick={handleLogout}
              className="rounded-2xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium text-gray-600 transition hover:bg-gray-50"
            >
              ออกจากระบบ
            </button>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-4 py-8">
        <section className="rounded-[32px] border border-[#f5d8df] bg-white/90 p-6 shadow-sm md:p-8">
          <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-sm font-bold text-[#df6f91]">
                Admin Dashboard
              </p>

              <h2 className="mt-2 text-3xl font-black text-[#4f4144] md:text-4xl">
                เลือกเมนูที่ต้องการจัดการ
              </h2>

              <p className="mt-3 max-w-2xl text-sm leading-7 text-[#8a7479]">
                ใช้หน้านี้เป็นศูนย์กลางหลังร้าน สำหรับจัดการสินค้า
                ข่าวสารหน้าแรก และเปิดดูหน้าร้านจริง
              </p>
            </div>

            <Link
              href="/admin/products/new"
              className="inline-flex items-center justify-center rounded-2xl bg-[#df6f91] px-5 py-3 text-sm font-black text-white shadow-sm transition hover:bg-[#d35d82]"
            >
              + เพิ่มสินค้าใหม่
            </Link>
          </div>
        </section>

        {message && (
          <div className="mt-5 rounded-[22px] border border-[#f7dce5] bg-white px-5 py-4 text-sm font-bold text-[#d65f84] shadow-sm">
            {message}
          </div>
        )}

        <section className="mt-6 grid gap-4 md:grid-cols-4">
          <div className="rounded-[24px] border border-[#f5d8df] bg-white p-5 shadow-sm">
            <p className="text-sm font-semibold text-[#8a7479]">
              สินค้าทั้งหมด
            </p>
            <p className="mt-2 text-3xl font-black text-[#4f4144]">
              {loading ? "-" : stats.products}
            </p>
          </div>

          <div className="rounded-[24px] border border-[#f5d8df] bg-white p-5 shadow-sm">
            <p className="text-sm font-semibold text-[#8a7479]">
              สินค้าที่แสดง
            </p>
            <p className="mt-2 text-3xl font-black text-[#06a84f]">
              {loading ? "-" : stats.activeProducts}
            </p>
          </div>

          <div className="rounded-[24px] border border-[#f5d8df] bg-white p-5 shadow-sm">
            <p className="text-sm font-semibold text-[#8a7479]">
              ข่าวสารทั้งหมด
            </p>
            <p className="mt-2 text-3xl font-black text-[#4f4144]">
              {loading ? "-" : stats.notices}
            </p>
          </div>

          <div className="rounded-[24px] border border-[#f5d8df] bg-white p-5 shadow-sm">
            <p className="text-sm font-semibold text-[#8a7479]">
              ข่าวสารที่แสดง
            </p>
            <p className="mt-2 text-3xl font-black text-[#df6f91]">
              {loading ? "-" : stats.activeNotices}
            </p>
          </div>
        </section>

        <section className="mt-6 grid gap-5 md:grid-cols-3">
          <Link
            href="/admin/products"
            className="group rounded-[30px] border border-[#f5d8df] bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-md"
          >
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#fff1f5] text-3xl">
              🛍️
            </div>

            <h3 className="mt-5 text-xl font-black text-[#4f4144]">
              จัดการสินค้า
            </h3>

            <p className="mt-2 text-sm leading-7 text-[#8a7479]">
              เพิ่มสินค้า แก้ไขราคา ตั้งโปรโมชัน เปิด/ซ่อนสินค้า
              และจัดการ Best Seller
            </p>

            <div className="mt-5 inline-flex rounded-2xl bg-[#df6f91] px-4 py-2.5 text-sm font-bold text-white transition group-hover:bg-[#d35d82]">
              เข้าไปจัดการสินค้า
            </div>
          </Link>

          <Link
            href="/admin/notices"
            className="group rounded-[30px] border border-[#f5d8df] bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-md"
          >
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#fff7e8] text-3xl">
              📢
            </div>

            <h3 className="mt-5 text-xl font-black text-[#4f4144]">
              ข่าวสารหน้าแรก
            </h3>

            <p className="mt-2 text-sm leading-7 text-[#8a7479]">
              แก้ไขกล่องแจ้งข่าวสารจากร้าน เช่น โปรใหม่ สินค้าใหม่
              หรือข้อมูลสำคัญสำหรับลูกค้า
            </p>

            <div className="mt-5 inline-flex rounded-2xl bg-[#df6f91] px-4 py-2.5 text-sm font-bold text-white transition group-hover:bg-[#d35d82]">
              เข้าไปจัดการข่าวสาร
            </div>
          </Link>

          <Link
            href="/"
            className="group rounded-[30px] border border-[#f5d8df] bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-md"
          >
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#f1fff5] text-3xl">
              🏠
            </div>

            <h3 className="mt-5 text-xl font-black text-[#4f4144]">
              ดูหน้าร้าน
            </h3>

            <p className="mt-2 text-sm leading-7 text-[#8a7479]">
              เปิดหน้าเว็บจริงเพื่อตรวจสินค้า โปรโมชัน ตะกร้า
              และหน้าที่ลูกค้าจะเห็น
            </p>

            <div className="mt-5 inline-flex rounded-2xl bg-[#06c755] px-4 py-2.5 text-sm font-bold text-white transition group-hover:bg-[#06b64d]">
              เปิดหน้าร้าน
            </div>
          </Link>
        </section>

        <section className="mt-6 rounded-[28px] border border-[#f5d8df] bg-white p-5 shadow-sm">
          <h3 className="text-lg font-black text-[#4f4144]">
            ลำดับการทำงานที่แนะนำ
          </h3>

          <div className="mt-4 grid gap-3 md:grid-cols-3">
            <div className="rounded-[22px] bg-[#fff9f5] p-4">
              <p className="font-black text-[#df6f91]">1. ลงสินค้า</p>
              <p className="mt-1 text-sm leading-6 text-[#8a7479]">
                เพิ่มรูปปก ราคา ลิงก์ LINE Store และสถานะโปรโมชันให้ครบ
              </p>
            </div>

            <div className="rounded-[22px] bg-[#fff9f5] p-4">
              <p className="font-black text-[#df6f91]">2. อัปเดตข่าวสาร</p>
              <p className="mt-1 text-sm leading-6 text-[#8a7479]">
                แก้ข้อความแจ้งข่าวสารหน้าแรกให้ตรงกับช่วงโปรล่าสุด
              </p>
            </div>

            <div className="rounded-[22px] bg-[#fff9f5] p-4">
              <p className="font-black text-[#df6f91]">3. เช็กหน้าร้าน</p>
              <p className="mt-1 text-sm leading-6 text-[#8a7479]">
                ทดสอบเพิ่มตะกร้า คัดลอกรายการ และเปิดแชท LINE ก่อนแชร์เว็บ
              </p>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
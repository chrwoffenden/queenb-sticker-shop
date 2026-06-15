"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function AdminLoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [checkingSession, setCheckingSession] =
    useState(true);

  useEffect(() => {
    const checkSession = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        router.replace("/admin/products");
        return;
      }

      setCheckingSession(false);
    };

    checkSession();
  }, [router]);

  const handleLogin = async (
    event: FormEvent<HTMLFormElement>,
  ) => {
    event.preventDefault();

    if (!email.trim() || !password) {
      setMessage("กรุณากรอกอีเมลและรหัสผ่าน");
      return;
    }

    setLoading(true);
    setMessage("");

    const { error } =
      await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

    if (error) {
      console.error("เข้าสู่ระบบไม่สำเร็จ", error);
      setMessage(
        "อีเมลหรือรหัสผ่านไม่ถูกต้อง กรุณาลองใหม่",
      );
      setLoading(false);
      return;
    }

    router.replace("/admin/products");
    router.refresh();
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
    <main className="flex min-h-screen items-center justify-center bg-gradient-to-br from-[#fff1f6] via-[#fff8f3] to-[#fff8db] px-4 py-10">
      <section className="w-full max-w-md rounded-[32px] border border-pink-100 bg-white p-6 shadow-xl md:p-8">
        <div className="text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[#ffe1eb] text-3xl">
            🐝
          </div>

          <p className="mt-5 text-sm font-semibold text-[#dc7393]">
            queenb.sticker
          </p>

          <h1 className="mt-1 text-2xl font-bold text-[#4f4144]">
            เข้าสู่ระบบหลังบ้าน
          </h1>

          <p className="mt-2 text-sm leading-6 text-gray-500">
            สำหรับจัดการสินค้า รูปภาพ ราคา
            และโปรโมชั่น
          </p>
        </div>

        <form
          onSubmit={handleLogin}
          className="mt-7 space-y-4"
        >
          <div>
            <label
              htmlFor="email"
              className="text-sm font-semibold text-[#5c4a50]"
            >
              อีเมล
            </label>

            <input
              id="email"
              type="email"
              value={email}
              onChange={(event) => {
                setEmail(event.target.value);
                setMessage("");
              }}
              placeholder="admin@example.com"
              autoComplete="email"
              className="mt-2 w-full rounded-2xl border border-pink-100 px-4 py-3 outline-none transition focus:border-[#df7796] focus:ring-2 focus:ring-pink-100"
            />
          </div>

          <div>
            <label
              htmlFor="password"
              className="text-sm font-semibold text-[#5c4a50]"
            >
              รหัสผ่าน
            </label>

            <input
              id="password"
              type="password"
              value={password}
              onChange={(event) => {
                setPassword(event.target.value);
                setMessage("");
              }}
              placeholder="กรอกรหัสผ่าน"
              autoComplete="current-password"
              className="mt-2 w-full rounded-2xl border border-pink-100 px-4 py-3 outline-none transition focus:border-[#df7796] focus:ring-2 focus:ring-pink-100"
            />
          </div>

          {message && (
            <div className="rounded-2xl bg-red-50 px-4 py-3 text-center text-sm text-red-600">
              {message}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-2xl bg-[#df6f91] px-4 py-3.5 font-semibold text-white transition hover:bg-[#d35d82] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading
              ? "กำลังเข้าสู่ระบบ..."
              : "เข้าสู่ระบบ"}
          </button>
        </form>

        <a
          href="/"
          className="mt-4 block w-full rounded-2xl px-4 py-3 text-center text-sm font-medium text-gray-500 transition hover:bg-gray-50"
        >
          ← กลับหน้าร้าน
        </a>
      </section>
    </main>
  );
}
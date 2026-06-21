"use client";

import { FormEvent, useMemo, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

type OrderStatus =
  | "pending_review"
  | "waiting_payment"
  | "paid"
  | "preparing_delivery"
  | "delivered"
  | "cancelled";

type StatusItem = {
  value: OrderStatus;
  label: string;
  description: string;
};

type OrderStatusItem = {
  id: string;
  product_name: string;
  product_category: string | null;
  product_image: string | null;
  quantity: number;
  price_each: number | string;
  subtotal: number | string;
};

type OrderStatusResult = {
  id: string;
  order_number: string;
  contact_type: "line-id" | "qr-code";
  total_quantity: number;
  total_amount: number | string;
  status: OrderStatus;
  customer_note: string | null;
  created_at: string;
  updated_at: string;
  items: OrderStatusItem[];
};

const statusSteps: StatusItem[] = [
  {
    value: "pending_review",
    label: "รอตรวจสอบ",
    description: "ร้านได้รับออเดอร์แล้ว กำลังตรวจสอบรายการ",
  },
  {
    value: "waiting_payment",
    label: "รอชำระเงิน",
    description: "ร้านยืนยันรายการแล้ว รอขั้นตอนชำระเงิน",
  },
  {
    value: "paid",
    label: "ชำระเงินแล้ว",
    description: "ได้รับการชำระเงินแล้ว กำลังเตรียมส่งสินค้า",
  },
  {
    value: "preparing_delivery",
    label: "กำลังจัดส่ง",
    description: "ร้านกำลังส่งสติกเกอร์หรือธีมผ่าน LINE",
  },
  {
    value: "delivered",
    label: "ส่งของแล้ว",
    description: "ออเดอร์นี้ส่งสินค้าเรียบร้อยแล้ว",
  },
];

function formatPrice(price: number | string) {
  return new Intl.NumberFormat("th-TH").format(Number(price));
}

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat("th-TH", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function getStatusLabel(status: OrderStatus) {
  if (status === "cancelled") return "ยกเลิก";

  return (
    statusSteps.find((step) => step.value === status)?.label ??
    status
  );
}

function getStatusDescription(status: OrderStatus) {
  if (status === "cancelled") {
    return "ออเดอร์นี้ถูกยกเลิกแล้ว กรุณาติดต่อร้านทาง LINE หากมีข้อสงสัย";
  }

  return (
    statusSteps.find((step) => step.value === status)?.description ??
    "กำลังตรวจสอบสถานะออเดอร์"
  );
}

function getCurrentStepIndex(status: OrderStatus) {
  if (status === "cancelled") return -1;

  return statusSteps.findIndex((step) => step.value === status);
}

export default function OrderStatusPage() {
  const [orderNumber, setOrderNumber] = useState("");
  const [order, setOrder] = useState<OrderStatusResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const normalizedOrderNumber = useMemo(
    () => orderNumber.trim().toUpperCase(),
    [orderNumber],
  );

  const currentStepIndex = order
    ? getCurrentStepIndex(order.status)
    : -1;

  const handleSearch = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!normalizedOrderNumber) {
      setMessage("กรุณากรอกเลขออเดอร์");
      setOrder(null);
      return;
    }

    setLoading(true);
    setMessage("");
    setOrder(null);

    const { data, error } = await supabase.rpc("get_order_status", {
      search_order_number: normalizedOrderNumber,
    });

    if (error) {
      console.error("ค้นหาสถานะออเดอร์ไม่สำเร็จ", error);
      setMessage("ค้นหาสถานะออเดอร์ไม่สำเร็จ กรุณาลองใหม่อีกครั้ง");
      setLoading(false);
      return;
    }

    if (!data || data.length === 0) {
      setMessage("ไม่พบเลขออเดอร์นี้ กรุณาตรวจสอบเลขออเดอร์อีกครั้ง");
      setLoading(false);
      return;
    }

    setOrder(data[0] as OrderStatusResult);
    setLoading(false);
  };

  return (
    <main className="min-h-screen bg-[#fff9f5] px-4 py-5 text-[#4f4144] sm:px-6 lg:px-8">
      <div className="mx-auto max-w-4xl">
        <header className="rounded-[32px] border border-[#f5d8df] bg-white/90 p-5 shadow-sm">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <Link href="/" className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-2xl bg-[#fff1f5] shadow-sm">
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
                <h1 className="text-lg font-black text-[#4f4144]">
                  เช็กสถานะออเดอร์
                </h1>
              </div>
            </Link>

            <Link
              href="/"
              className="rounded-2xl border border-[#efc9d6] bg-white px-4 py-2.5 text-center text-sm font-bold text-[#d65f84] transition hover:bg-[#fff1f5]"
            >
              กลับหน้าร้าน
            </Link>
          </div>
        </header>

        <section className="mt-5 overflow-hidden rounded-[36px] border border-[#f5d8df] bg-gradient-to-br from-[#fff0f5] via-white to-[#fff7e8] p-6 text-center shadow-sm md:p-10">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-white text-3xl shadow-sm">
            🧾
          </div>

          <h2 className="mt-5 text-3xl font-black text-[#4f4144] md:text-4xl">
            ตรวจสอบสถานะสินค้า
          </h2>

          <p className="mx-auto mt-3 max-w-xl text-sm leading-7 text-[#8a7479]">
            กรอกเลขออเดอร์ที่ได้รับหลังจากสร้างรายการสั่งซื้อ
            เพื่อดูสถานะล่าสุดของออเดอร์ค่ะ
          </p>

          <form onSubmit={handleSearch} className="mx-auto mt-7 max-w-xl">
            <div className="grid gap-3 sm:grid-cols-[1fr_auto]">
              <input
                value={orderNumber}
                onChange={(event) => setOrderNumber(event.target.value)}
                placeholder="เช่น QB-260621-1234"
                className="rounded-2xl border border-[#f0d4dc] bg-white px-4 py-3.5 text-center text-sm font-bold uppercase tracking-wide text-[#4f4144] outline-none transition placeholder:normal-case placeholder:font-normal placeholder:tracking-normal focus:border-[#df6f91]"
              />

              <button
                type="submit"
                disabled={loading}
                className="rounded-2xl bg-[#df6f91] px-6 py-3.5 text-sm font-black text-white shadow-sm transition hover:bg-[#d35d82] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? "กำลังค้นหา..." : "เช็กสถานะ"}
              </button>
            </div>
          </form>
        </section>

        {message && (
          <div className="mt-5 rounded-[24px] border border-[#f7dce5] bg-white px-5 py-4 text-center text-sm font-bold text-[#d65f84] shadow-sm">
            {message}
          </div>
        )}

        {order && (
          <section className="mt-5 space-y-5">
            <div className="rounded-[32px] border border-[#f5d8df] bg-white p-5 shadow-sm md:p-7">
              <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                <div>
                  <p className="text-sm font-bold text-[#df6f91]">
                    เลขออเดอร์
                  </p>
                  <h3 className="mt-1 text-3xl font-black text-[#4f4144]">
                    {order.order_number}
                  </h3>

                  <p className="mt-3 text-sm text-[#8a7479]">
                    วันที่สั่งซื้อ: {formatDateTime(order.created_at)}
                  </p>
                  <p className="mt-1 text-sm text-[#8a7479]">
                    อัปเดตล่าสุด: {formatDateTime(order.updated_at)}
                  </p>
                </div>

                <div
                  className={
                    order.status === "cancelled"
                      ? "rounded-2xl bg-[#f4f0f1] px-5 py-3 text-center"
                      : "rounded-2xl bg-[#fff1f5] px-5 py-3 text-center"
                  }
                >
                  <p className="text-xs font-bold text-[#8a7479]">
                    สถานะปัจจุบัน
                  </p>
                  <p
                    className={
                      order.status === "cancelled"
                        ? "mt-1 text-xl font-black text-[#8a7479]"
                        : "mt-1 text-xl font-black text-[#df6f91]"
                    }
                  >
                    {getStatusLabel(order.status)}
                  </p>
                </div>
              </div>

              <div className="mt-5 rounded-[24px] bg-[#fff9f5] p-5">
                <p className="text-sm font-bold text-[#4f4144]">
                  {getStatusDescription(order.status)}
                </p>
              </div>
            </div>

            {order.status !== "cancelled" && (
              <div className="rounded-[32px] border border-[#f5d8df] bg-white p-5 shadow-sm md:p-7">
                <h3 className="text-lg font-black text-[#4f4144]">
                  ขั้นตอนสถานะออเดอร์
                </h3>

                <div className="mt-5 space-y-3">
                  {statusSteps.map((step, index) => {
                    const isDone = currentStepIndex >= index;
                    const isCurrent = currentStepIndex === index;

                    return (
                      <div
                        key={step.value}
                        className={
                          isCurrent
                            ? "rounded-[22px] border border-[#df6f91] bg-[#fff1f5] p-4"
                            : isDone
                              ? "rounded-[22px] border border-[#e2f6e8] bg-[#f1fff5] p-4"
                              : "rounded-[22px] border border-[#f0e5e8] bg-[#fff9f5] p-4"
                        }
                      >
                        <div className="flex gap-3">
                          <div
                            className={
                              isDone
                                ? "flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#06c755] text-sm font-black text-white"
                                : "flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white text-sm font-black text-[#b09ca1]"
                            }
                          >
                            {isDone ? "✓" : index + 1}
                          </div>

                          <div>
                            <p className="font-black text-[#4f4144]">
                              {step.label}
                            </p>
                            <p className="mt-1 text-sm leading-6 text-[#8a7479]">
                              {step.description}
                            </p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            <div className="rounded-[32px] border border-[#f5d8df] bg-white p-5 shadow-sm md:p-7">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <h3 className="text-lg font-black text-[#4f4144]">
                  รายการสินค้า
                </h3>

                <p className="text-sm font-bold text-[#df6f91]">
                  รวม ฿{formatPrice(order.total_amount)}
                </p>
              </div>

              <div className="mt-5 space-y-3">
                {order.items.map((item) => (
                  <div
                    key={item.id}
                    className="flex gap-3 rounded-[22px] bg-[#fff9f5] p-3"
                  >
                    <div className="h-16 w-16 shrink-0 overflow-hidden rounded-2xl bg-[#fff1f5]">
                      {item.product_image ? (
                        <img
                          src={item.product_image}
                          alt={item.product_name}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-xl">
                          🎀
                        </div>
                      )}
                    </div>

                    <div className="min-w-0 flex-1">
                      <p className="font-black text-[#4f4144]">
                        {item.product_name}
                      </p>
                      <p className="mt-1 text-xs font-semibold text-[#8a7479]">
                        {item.product_category || "-"}
                      </p>
                      <p className="mt-2 text-sm text-[#8a7479]">
                        ฿{formatPrice(item.price_each)} × {item.quantity} =
                        ฿{formatPrice(item.subtotal)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-5 rounded-[22px] bg-[#fff1f5] p-4 text-sm leading-7 text-[#806f73]">
                สินค้าจะถูกส่งผ่าน LINE ตามข้อมูลที่แจ้งไว้ในแชทร้าน
                หากต้องการสอบถามเพิ่มเติม กรุณาแจ้งเลขออเดอร์นี้กับร้านค่ะ
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <Link
                href="/"
                className="rounded-2xl bg-[#df6f91] px-5 py-3 text-center text-sm font-black text-white shadow-sm transition hover:bg-[#d35d82]"
              >
                เลือกสินค้าเพิ่ม
              </Link>

              <a
                href="https://line.me/R/ti/p/@ecx0250y"
                target="_blank"
                rel="noreferrer"
                className="rounded-2xl bg-[#06c755] px-5 py-3 text-center text-sm font-black text-white shadow-sm transition hover:bg-[#06b64d]"
              >
                ติดต่อร้านทาง LINE
              </a>
            </div>
          </section>
        )}
      </div>
    </main>
  );
}
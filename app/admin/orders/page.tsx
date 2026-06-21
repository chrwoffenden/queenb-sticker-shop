"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

type OrderStatus =
  | "pending_review"
  | "waiting_payment"
  | "paid"
  | "preparing_delivery"
  | "delivered"
  | "cancelled";

type OrderRow = {
  id: string;
  order_number: string;
  contact_type: "line-id" | "qr-code";
  customer_line_ids: string[] | null;
  customer_note: string | null;
  total_quantity: number;
  total_amount: number | string;
  status: OrderStatus;
  order_message: string | null;
  created_at: string;
  updated_at: string;
};

type OrderItemRow = {
  id: string;
  order_id: string;
  product_id: number | null;
  product_name: string;
  product_slug: string | null;
  product_category: string | null;
  product_image: string | null;
  line_store_url: string | null;
  quantity: number;
  price_each: number | string;
  subtotal: number | string;
  created_at: string;
};

type OrderWithItems = OrderRow & {
  items: OrderItemRow[];
};

type StatusFilter = "all" | OrderStatus;

const statusOptions: {
  value: OrderStatus;
  label: string;
  badgeClassName: string;
}[] = [
  {
    value: "pending_review",
    label: "รอตรวจสอบ",
    badgeClassName: "bg-[#fff7e8] text-[#9a7b36]",
  },
  {
    value: "waiting_payment",
    label: "รอชำระเงิน",
    badgeClassName: "bg-[#fff1f5] text-[#d65f84]",
  },
  {
    value: "paid",
    label: "ชำระเงินแล้ว",
    badgeClassName: "bg-[#ecfdf3] text-[#06934a]",
  },
  {
    value: "preparing_delivery",
    label: "กำลังจัดส่ง",
    badgeClassName: "bg-[#eef6ff] text-[#2472b9]",
  },
  {
    value: "delivered",
    label: "ส่งของแล้ว",
    badgeClassName: "bg-[#eafaf0] text-[#06a84f]",
  },
  {
    value: "cancelled",
    label: "ยกเลิก",
    badgeClassName: "bg-[#f4f0f1] text-[#8a7479]",
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
  return (
    statusOptions.find((option) => option.value === status)?.label ??
    status
  );
}

function getStatusBadgeClassName(status: OrderStatus) {
  return (
    statusOptions.find((option) => option.value === status)
      ?.badgeClassName ?? "bg-[#f4f0f1] text-[#8a7479]"
  );
}

function getLineIdsText(order: OrderRow) {
  if (order.contact_type === "qr-code") {
    return "ลูกค้าเลือกส่ง QR Code ในแชท LINE";
  }

  if (!order.customer_line_ids || order.customer_line_ids.length === 0) {
    return "-";
  }

  return order.customer_line_ids.join(", ");
}

export default function AdminOrdersPage() {
  const router = useRouter();

  const [orders, setOrders] = useState<OrderWithItems[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [searchText, setSearchText] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);
  const [updatingOrderId, setUpdatingOrderId] = useState<string | null>(null);
  const [deletingOrderId, setDeletingOrderId] = useState<string | null>(null);

  const loadOrders = useCallback(async () => {
    setLoading(true);
    setMessage("");

    const { data: ordersData, error: ordersError } = await supabase
      .from("orders")
      .select(
        `
          id,
          order_number,
          contact_type,
          customer_line_ids,
          customer_note,
          total_quantity,
          total_amount,
          status,
          order_message,
          created_at,
          updated_at
        `,
      )
      .order("created_at", { ascending: false });

    if (ordersError) {
      console.error("โหลดออเดอร์ไม่สำเร็จ", ordersError);
      setMessage("โหลดออเดอร์ไม่สำเร็จ กรุณาตรวจสอบตาราง orders");
      setLoading(false);
      return;
    }

    const orderIds = (ordersData ?? []).map((order) => order.id);

    let itemsData: OrderItemRow[] = [];

    if (orderIds.length > 0) {
      const { data: orderItemsData, error: orderItemsError } =
        await supabase
          .from("order_items")
          .select(
            `
              id,
              order_id,
              product_id,
              product_name,
              product_slug,
              product_category,
              product_image,
              line_store_url,
              quantity,
              price_each,
              subtotal,
              created_at
            `,
          )
          .in("order_id", orderIds)
          .order("created_at", { ascending: true });

      if (orderItemsError) {
        console.error("โหลดรายการสินค้าในออเดอร์ไม่สำเร็จ", orderItemsError);
        setMessage("โหลดรายการสินค้าในออเดอร์ไม่สำเร็จ");
      } else {
        itemsData = (orderItemsData ?? []) as OrderItemRow[];
      }
    }

    const ordersWithItems = ((ordersData ?? []) as OrderRow[]).map(
      (order) => ({
        ...order,
        items: itemsData.filter((item) => item.order_id === order.id),
      }),
    );

    setOrders(ordersWithItems);
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

      await loadOrders();
    };

    initializePage();
  }, [loadOrders, router]);

  const filteredOrders = useMemo(() => {
    const normalizedSearchText = searchText.trim().toLowerCase();

    return orders.filter((order) => {
      const matchesStatus =
        statusFilter === "all" || order.status === statusFilter;

      const lineIdsText = getLineIdsText(order).toLowerCase();

      const matchesSearch =
        normalizedSearchText.length === 0 ||
        order.order_number.toLowerCase().includes(normalizedSearchText) ||
        lineIdsText.includes(normalizedSearchText) ||
        order.items.some((item) =>
          item.product_name.toLowerCase().includes(normalizedSearchText),
        );

      return matchesStatus && matchesSearch;
    });
  }, [orders, searchText, statusFilter]);

  const summary = useMemo(() => {
    const pendingCount = orders.filter(
      (order) => order.status === "pending_review",
    ).length;

    const waitingPaymentCount = orders.filter(
      (order) => order.status === "waiting_payment",
    ).length;

    const deliveredCount = orders.filter(
      (order) => order.status === "delivered",
    ).length;

    const totalSales = orders
      .filter((order) => order.status !== "cancelled")
      .reduce((sum, order) => sum + Number(order.total_amount), 0);

    return {
      totalOrders: orders.length,
      pendingCount,
      waitingPaymentCount,
      deliveredCount,
      totalSales,
    };
  }, [orders]);

  const handleUpdateStatus = async (
    orderId: string,
    nextStatus: OrderStatus,
  ) => {
    setUpdatingOrderId(orderId);
    setMessage("");

    const { error } = await supabase
      .from("orders")
      .update({ status: nextStatus })
      .eq("id", orderId);

    if (error) {
      console.error("อัปเดตสถานะออเดอร์ไม่สำเร็จ", error);
      setMessage("อัปเดตสถานะออเดอร์ไม่สำเร็จ");
      setUpdatingOrderId(null);
      return;
    }

    setOrders((currentOrders) =>
      currentOrders.map((order) =>
        order.id === orderId
          ? {
              ...order,
              status: nextStatus,
              updated_at: new Date().toISOString(),
            }
          : order,
      ),
    );

    setMessage("อัปเดตสถานะออเดอร์เรียบร้อยแล้ว");
    setUpdatingOrderId(null);
  };

  const handleDeleteOrder = async (order: OrderWithItems) => {
    const confirmed = window.confirm(
      `ต้องการลบออเดอร์ ${order.order_number} ใช่ไหม?`,
    );

    if (!confirmed) return;

    setDeletingOrderId(order.id);
    setMessage("");

    const { error } = await supabase
      .from("orders")
      .delete()
      .eq("id", order.id);

    if (error) {
      console.error("ลบออเดอร์ไม่สำเร็จ", error);
      setMessage("ลบออเดอร์ไม่สำเร็จ");
      setDeletingOrderId(null);
      return;
    }

    setOrders((currentOrders) =>
      currentOrders.filter((currentOrder) => currentOrder.id !== order.id),
    );

    setMessage("ลบออเดอร์เรียบร้อยแล้ว");
    setDeletingOrderId(null);
  };

  const handleCopyOrderMessage = async (order: OrderWithItems) => {
    const text =
      order.order_message ||
      [
        `เลขออเดอร์: ${order.order_number}`,
        `สถานะ: ${getStatusLabel(order.status)}`,
        `LINE ID: ${getLineIdsText(order)}`,
        `ยอดรวม: ${formatPrice(order.total_amount)} บาท`,
      ].join("\n");

    try {
      await navigator.clipboard.writeText(text);
      setMessage(`คัดลอกข้อความออเดอร์ ${order.order_number} แล้ว`);
    } catch (error) {
      console.error("คัดลอกข้อความออเดอร์ไม่สำเร็จ", error);
      setMessage("คัดลอกข้อความออเดอร์ไม่สำเร็จ");
    }
  };

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
                จัดการออเดอร์
              </h1>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-end gap-2">
            <button
              type="button"
              onClick={() => router.push("/admin")}
              className="rounded-2xl border border-[#f2d5df] bg-white px-4 py-2.5 text-sm font-semibold text-[#d65f84] transition hover:bg-[#fff1f5]"
            >
              หน้าหลักแอดมิน
            </button>

            <button
              type="button"
              onClick={() => router.push("/admin/products")}
              className="hidden rounded-2xl border border-[#f2d5df] bg-white px-4 py-2.5 text-sm font-semibold text-[#d65f84] transition hover:bg-[#fff1f5] md:block"
            >
              จัดการสินค้า
            </button>

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
          <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-sm font-bold text-[#df6f91]">
                Orders Management
              </p>

              <h2 className="mt-2 text-3xl font-black text-[#4f4144] md:text-4xl">
                ออเดอร์จากลูกค้า
              </h2>

              <p className="mt-3 max-w-2xl text-sm leading-7 text-[#8a7479]">
                ดูเลขออเดอร์ รายการสินค้า LINE ID ลูกค้า ยอดรวม
                และเปลี่ยนสถานะออเดอร์ได้จากหน้านี้
              </p>
            </div>

            <button
              type="button"
              onClick={loadOrders}
              className="rounded-2xl bg-[#df6f91] px-5 py-3 text-sm font-black text-white shadow-sm transition hover:bg-[#d35d82]"
            >
              รีเฟรชออเดอร์
            </button>
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
              ออเดอร์ทั้งหมด
            </p>
            <p className="mt-2 text-3xl font-black text-[#4f4144]">
              {loading ? "-" : summary.totalOrders}
            </p>
          </div>

          <div className="rounded-[24px] border border-[#f5d8df] bg-white p-5 shadow-sm">
            <p className="text-sm font-semibold text-[#8a7479]">
              รอตรวจสอบ
            </p>
            <p className="mt-2 text-3xl font-black text-[#df6f91]">
              {loading ? "-" : summary.pendingCount}
            </p>
          </div>

          <div className="rounded-[24px] border border-[#f5d8df] bg-white p-5 shadow-sm">
            <p className="text-sm font-semibold text-[#8a7479]">
              รอชำระเงิน
            </p>
            <p className="mt-2 text-3xl font-black text-[#9a7b36]">
              {loading ? "-" : summary.waitingPaymentCount}
            </p>
          </div>

          <div className="rounded-[24px] border border-[#f5d8df] bg-white p-5 shadow-sm">
            <p className="text-sm font-semibold text-[#8a7479]">
              ยอดรวมไม่รวมยกเลิก
            </p>
            <p className="mt-2 text-3xl font-black text-[#06a84f]">
              ฿{loading ? "-" : formatPrice(summary.totalSales)}
            </p>
          </div>
        </section>

        <section className="mt-6 rounded-[28px] border border-[#f5d8df] bg-white p-5 shadow-sm">
          <div className="grid gap-4 lg:grid-cols-[1fr_260px]">
            <div>
              <label className="text-sm font-bold text-[#4f4144]">
                ค้นหาออเดอร์
              </label>
              <input
                value={searchText}
                onChange={(event) => setSearchText(event.target.value)}
                placeholder="ค้นหาเลขออเดอร์, LINE ID, ชื่อสินค้า"
                className="mt-2 w-full rounded-2xl border border-[#f0d4dc] bg-[#fff9fb] px-4 py-3 text-sm outline-none transition focus:border-[#df6f91] focus:bg-white"
              />
            </div>

            <div>
              <label className="text-sm font-bold text-[#4f4144]">
                สถานะ
              </label>
              <select
                value={statusFilter}
                onChange={(event) =>
                  setStatusFilter(event.target.value as StatusFilter)
                }
                className="mt-2 w-full rounded-2xl border border-[#f0d4dc] bg-[#fff9fb] px-4 py-3 text-sm outline-none transition focus:border-[#df6f91] focus:bg-white"
              >
                <option value="all">ทั้งหมด</option>
                {statusOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </section>

        <section className="mt-6">
          {loading ? (
            <div className="rounded-[28px] border border-[#f5d8df] bg-white p-8 text-center text-sm font-bold text-[#8a7479] shadow-sm">
              กำลังโหลดออเดอร์...
            </div>
          ) : filteredOrders.length === 0 ? (
            <div className="rounded-[28px] border border-[#f5d8df] bg-white p-8 text-center text-sm leading-7 text-[#8a7479] shadow-sm">
              ยังไม่มีออเดอร์ที่ตรงกับเงื่อนไข
              <br />
              เมื่อลูกค้ากดสร้างออเดอร์ รายการจะมาแสดงที่หน้านี้ค่ะ
            </div>
          ) : (
            <div className="space-y-4">
              {filteredOrders.map((order) => {
                const isExpanded = expandedOrderId === order.id;

                return (
                  <article
                    key={order.id}
                    className="overflow-hidden rounded-[28px] border border-[#f5d8df] bg-white shadow-sm"
                  >
                    <div className="p-5">
                      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <h3 className="text-xl font-black text-[#4f4144]">
                              {order.order_number}
                            </h3>

                            <span
                              className={`rounded-full px-3 py-1 text-xs font-bold ${getStatusBadgeClassName(
                                order.status,
                              )}`}
                            >
                              {getStatusLabel(order.status)}
                            </span>
                          </div>

                          <p className="mt-2 text-sm text-[#8a7479]">
                            วันที่สั่ง: {formatDateTime(order.created_at)}
                          </p>

                          <p className="mt-2 text-sm font-semibold text-[#4f4144]">
                            LINE ID / วิธีรับสินค้า: {getLineIdsText(order)}
                          </p>

                          {order.customer_note && (
                            <p className="mt-2 text-sm leading-6 text-[#8a7479]">
                              หมายเหตุ: {order.customer_note}
                            </p>
                          )}

                          <div className="mt-3 flex flex-wrap gap-2 text-xs font-bold text-[#8a7479]">
                            <span className="rounded-full bg-[#fff9f5] px-3 py-1">
                              {order.total_quantity} ชิ้น
                            </span>
                            <span className="rounded-full bg-[#fff9f5] px-3 py-1">
                              ฿{formatPrice(order.total_amount)}
                            </span>
                            <span className="rounded-full bg-[#fff9f5] px-3 py-1">
                              {order.items.length} รายการสินค้า
                            </span>
                          </div>
                        </div>

                        <div className="flex flex-col gap-2 sm:min-w-[260px]">
                          <select
                            value={order.status}
                            onChange={(event) =>
                              handleUpdateStatus(
                                order.id,
                                event.target.value as OrderStatus,
                              )
                            }
                            disabled={updatingOrderId === order.id}
                            className="rounded-2xl border border-[#f0d4dc] bg-[#fff9fb] px-4 py-3 text-sm font-bold text-[#4f4144] outline-none transition focus:border-[#df6f91] focus:bg-white disabled:opacity-60"
                          >
                            {statusOptions.map((option) => (
                              <option key={option.value} value={option.value}>
                                {option.label}
                              </option>
                            ))}
                          </select>

                          <div className="grid grid-cols-2 gap-2">
                            <button
                              type="button"
                              onClick={() =>
                                setExpandedOrderId(
                                  isExpanded ? null : order.id,
                                )
                              }
                              className="rounded-2xl border border-[#efc9d6] bg-white px-3 py-2.5 text-sm font-bold text-[#d65f84] transition hover:bg-[#fff1f5]"
                            >
                              {isExpanded ? "ซ่อนรายละเอียด" : "ดูรายละเอียด"}
                            </button>

                            <button
                              type="button"
                              onClick={() => handleCopyOrderMessage(order)}
                              className="rounded-2xl border border-[#efc9d6] bg-white px-3 py-2.5 text-sm font-bold text-[#d65f84] transition hover:bg-[#fff1f5]"
                            >
                              คัดลอก
                            </button>
                          </div>

                          <button
                            type="button"
                            onClick={() => handleDeleteOrder(order)}
                            disabled={deletingOrderId === order.id}
                            className="rounded-2xl bg-[#4f4144] px-3 py-2.5 text-sm font-bold text-white transition hover:bg-[#2f2729] disabled:opacity-60"
                          >
                            {deletingOrderId === order.id
                              ? "กำลังลบ..."
                              : "ลบออเดอร์"}
                          </button>
                        </div>
                      </div>
                    </div>

                    {isExpanded && (
                      <div className="border-t border-[#f5d8df] bg-[#fff9f5] p-5">
                        <h4 className="text-sm font-black text-[#4f4144]">
                          รายการสินค้า
                        </h4>

                        <div className="mt-4 space-y-3">
                          {order.items.length === 0 ? (
                            <p className="rounded-2xl bg-white p-4 text-sm text-[#8a7479]">
                              ไม่มีรายการสินค้าในออเดอร์นี้
                            </p>
                          ) : (
                            order.items.map((item) => (
                              <div
                                key={item.id}
                                className="flex gap-3 rounded-2xl bg-white p-3 shadow-sm"
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
                                    ฿{formatPrice(item.price_each)} ×{" "}
                                    {item.quantity} = ฿
                                    {formatPrice(item.subtotal)}
                                  </p>

                                  {item.line_store_url && (
                                    <a
                                      href={item.line_store_url}
                                      target="_blank"
                                      rel="noreferrer"
                                      className="mt-2 inline-flex text-xs font-bold text-[#06a84f] underline"
                                    >
                                      เปิด LINE Store
                                    </a>
                                  )}
                                </div>
                              </div>
                            ))
                          )}
                        </div>

                        {order.order_message && (
                          <div className="mt-5">
                            <h4 className="text-sm font-black text-[#4f4144]">
                              ข้อความออเดอร์ที่ลูกค้าคัดลอก
                            </h4>

                            <pre className="mt-3 max-h-72 overflow-auto whitespace-pre-wrap rounded-2xl bg-white p-4 text-xs leading-6 text-[#6f5f63] shadow-sm">
                              {order.order_message}
                            </pre>
                          </div>
                        )}
                      </div>
                    )}
                  </article>
                );
              })}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
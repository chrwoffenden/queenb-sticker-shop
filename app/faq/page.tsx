"use client";

import Link from "next/link";

const SHOP_LINE_URL = "https://line.me/R/ti/p/@ecx0250y";
const INSTAGRAM_URL = "https://www.instagram.com/queenb.sticker/";
const PROMOTION_GROUP_URL =
  "https://line.me/ti/g2/xe-yDco3LOiVICuEyUTE-1sQR6wrwHZGipDXOQ?utm_source=invitation&utm_medium=link_copy&utm_campaign=default";

const faqItems = [
  {
    question: "สั่งซื้อสินค้าอย่างไร?",
    answer:
      "เลือกสินค้าที่ต้องการ กดเพิ่มลงตะกร้า กรอก LINE ID ของผู้รับให้ครบตามจำนวนสินค้า แล้วส่งรายละเอียดคำสั่งซื้อไปยังแชท LINE ร้านเพื่อยืนยันการชำระเงิน",
  },
  {
    question: "สามารถซื้อให้คนอื่นได้ไหม?",
    answer:
      "ได้ค่ะ สามารถกรอก LINE ID ของผู้รับแต่ละคนได้ โดยตรวจสอบตัวสะกดและจำนวนผู้รับให้ถูกต้องก่อนส่งคำสั่งซื้อ",
  },
  {
    question: "ต้องกรอก LINE ID กี่รายการ?",
    answer:
      "จำนวน LINE ID ต้องตรงกับจำนวนสินค้าที่สั่งซื้อ เช่น ซื้อ 2 ชิ้น ต้องระบุผู้รับให้ครบ 2 รายการ โดยผู้รับอาจเป็นคนเดียวกันหรือต่างคนกันก็ได้",
  },
  {
    question: "ใช้เวลาได้รับสินค้านานเท่าไร?",
    answer:
      "ร้านจะดำเนินการหลังตรวจสอบยอดชำระเรียบร้อย ระยะเวลาอาจแตกต่างกันตามคิวงานและช่วงเวลา กรุณาติดตามสถานะผ่านแชท LINE ร้าน",
  },
  {
    question: "กรอก LINE ID ผิด แก้ไขได้ไหม?",
    answer:
      "ควรแจ้งร้านทันที ก่อนที่ร้านจะดำเนินการส่งสินค้า หากดำเนินการแล้วอาจไม่สามารถแก้ไขหรือเปลี่ยนผู้รับได้",
  },
  {
    question: "ซื้อแล้วสามารถคืนเงินหรือเปลี่ยนสินค้าได้ไหม?",
    answer:
      "เนื่องจากเป็นสินค้าดิจิทัล กรุณาตรวจสอบชื่อสินค้า ประเภทสินค้า จำนวน และ LINE ID ให้ถูกต้องก่อนยืนยันคำสั่งซื้อ",
  },
  {
    question: "สติกเกอร์และธีมใช้กับ LINE ประเทศไทยได้ไหม?",
    answer:
      "กรุณาตรวจสอบรายละเอียดและลิงก์ LINE STORE ของสินค้าแต่ละรายการก่อนสั่งซื้อ เพราะเงื่อนไขการใช้งานอาจแตกต่างกันตามสินค้าและบัญชี LINE",
  },
  {
    question: "สินค้าที่ลดราคา หมดโปรโมชั่นเมื่อไร?",
    answer:
      "วันที่สิ้นสุดโปรโมชั่นจะแสดงบนหน้าสินค้า หากเลยวันกำหนด ระบบจะแสดงราคาปกติโดยอัตโนมัติ",
  },
  {
    question: "ติดตามสินค้าใหม่และโปรโมชั่นได้ที่ไหน?",
    answer:
      "ติดตามได้ทาง Instagram @queenb.sticker และเข้าร่วมกลุ่ม QueenB's Promotion เพื่อรับข่าวสินค้าใหม่และโปรโมชั่นของร้าน",
  },
  {
    question: "ติดต่อร้านผ่านช่องทางไหนเร็วที่สุด?",
    answer:
      "แนะนำให้ติดต่อผ่านแชท LINE ร้าน พร้อมส่งภาพหน้าจอหรือรายละเอียดคำสั่งซื้อ เพื่อให้ร้านตรวจสอบได้รวดเร็วขึ้น",
  },
];

export default function FAQPage() {
  return (
    <main className="min-h-screen bg-[#fff9f5] text-[#4f4144]">
      <header className="sticky top-0 z-30 border-b border-[#f5dfe6] bg-[#fff9f5]/95 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
          <Link href="/" className="flex min-w-0 items-center gap-3">
            <img
              src="/images/logo-icon.png"
              alt="queenb.sticker logo"
              className="h-11 w-11 shrink-0 rounded-2xl object-contain shadow-sm"
            />

            <div className="min-w-0">
              <p className="truncate text-base font-bold text-[#df6f91] sm:text-lg">
                queenb.sticker
              </p>
              <p className="truncate text-[11px] text-[#806d72] sm:text-xs">
                Cute stickers & LINE themes
              </p>
            </div>
          </Link>

          <Link
            href="/"
            className="shrink-0 rounded-full border border-[#e7cbd4] bg-white px-4 py-2 text-sm font-semibold text-[#7d666e] transition hover:bg-[#fff4f7]"
          >
            กลับหน้าร้าน
          </Link>
        </div>
      </header>

      <section className="px-4 pb-12 pt-10 sm:px-6 sm:pt-14">
        <div className="mx-auto max-w-3xl text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-3xl bg-[#fff0f5] text-3xl shadow-sm">
            ?
          </div>

          <p className="mt-5 text-sm font-semibold uppercase tracking-[0.2em] text-[#d97898]">
            Help Center
          </p>

          <h1 className="mt-2 text-3xl font-bold text-[#4f4144] sm:text-4xl">
            คำถามที่พบบ่อย
          </h1>

          <p className="mx-auto mt-4 max-w-2xl text-sm leading-7 text-[#806d72] sm:text-base">
            รวมคำตอบเกี่ยวกับการสั่งซื้อ การกรอกข้อมูลผู้รับ
            การรับสินค้า และโปรโมชั่นของร้าน queenb.sticker
          </p>
        </div>
      </section>

      <section className="px-4 pb-16 sm:px-6">
        <div className="mx-auto max-w-3xl space-y-3">
          {faqItems.map((item, index) => (
            <details
              key={item.question}
              className="group overflow-hidden rounded-3xl border border-[#f0d8e0] bg-white shadow-[0_10px_30px_rgba(173,107,131,0.07)]"
            >
              <summary className="flex cursor-pointer list-none items-center gap-4 px-5 py-5 text-left sm:px-6">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl bg-[#fff1f5] text-sm font-bold text-[#df6f91]">
                  {String(index + 1).padStart(2, "0")}
                </span>

                <span className="flex-1 text-sm font-bold leading-6 text-[#5b484e] sm:text-base">
                  {item.question}
                </span>

                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#fff7f9] text-xl text-[#d97898] transition group-open:rotate-45">
                  +
                </span>
              </summary>

              <div className="border-t border-[#f7e8ed] px-5 pb-6 pt-4 sm:px-6">
                <p className="pl-0 text-sm leading-7 text-[#806d72] sm:pl-13">
                  {item.answer}
                </p>
              </div>
            </details>
          ))}
        </div>
      </section>

      <section className="px-4 pb-16 sm:px-6">
        <div className="mx-auto max-w-3xl rounded-[32px] border border-[#f2dbe3] bg-[#fff1f5] px-6 py-8 text-center shadow-[0_16px_40px_rgba(177,112,135,0.08)] sm:px-10 sm:py-10">
          <img
            src="/images/logo-icon.png"
            alt="queenb.sticker"
            className="mx-auto h-16 w-16 rounded-3xl object-contain shadow-sm"
          />

          <h2 className="mt-4 text-2xl font-bold text-[#4f4144]">
            ยังมีคำถามอยู่ไหม?
          </h2>

          <p className="mx-auto mt-3 max-w-xl text-sm leading-7 text-[#806d72]">
            ส่งรายละเอียดหรือภาพหน้าจอมาให้ร้านตรวจสอบได้เลย
            ร้านจะตอบกลับตามลำดับข้อความค่ะ
          </p>

          <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
            <a
              href={SHOP_LINE_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-full bg-[#06c755] px-6 py-3 text-sm font-bold text-white transition hover:bg-[#05b84e]"
            >
              ติดต่อ LINE ร้าน
            </a>

            <a
              href={INSTAGRAM_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-full border border-[#e3afc1] bg-white px-6 py-3 text-sm font-bold text-[#c75d84] transition hover:bg-[#fff8fb]"
            >
              Instagram ร้าน
            </a>

            <a
              href={PROMOTION_GROUP_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-full border border-[#cdebd7] bg-white px-6 py-3 text-sm font-bold text-[#159647] transition hover:bg-[#f5fff8]"
            >
              กลุ่มแจ้งโปร
            </a>
          </div>
        </div>
      </section>

      <footer className="border-t border-[#f3dce4] bg-[#fff1f5] px-4 py-8 text-center">
        <p className="text-sm font-bold text-[#df6f91]">queenb.sticker</p>
        <p className="mt-1 text-xs text-[#9b838b]">
          © 2026 queenb.sticker · Cute stickers & LINE themes
        </p>
      </footer>
    </main>
  );
<<<<<<< HEAD
}
=======
}
>>>>>>> b480362f7b8279811f600ae53547e48bf8ead394

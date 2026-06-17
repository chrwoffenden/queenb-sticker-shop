import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "queenb.sticker",
    template: "%s | queenb.sticker",
  },
  description: "Cute stickers & LINE themes",
  icons: {
    icon: [
      {
        url: "/images/logo-icon.png?v=3",
        type: "image/png",
        sizes: "512x512",
      },
    ],
    shortcut: "/images/logo-icon.png?v=3",
    apple: [
      {
        url: "/images/logo-icon.png?v=3",
        type: "image/png",
        sizes: "512x512",
      },
    ],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="th">
      <head>
        <link
          rel="icon"
          type="image/png"
          sizes="512x512"
          href="/images/logo-icon.png?v=3"
        />
        <link
          rel="shortcut icon"
          type="image/png"
          href="/images/logo-icon.png?v=3"
        />
        <link
          rel="apple-touch-icon"
          href="/images/logo-icon.png?v=3"
        />
      </head>

      <body>{children}</body>
    </html>
  );
}
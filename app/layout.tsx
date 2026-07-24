import type { Metadata, Viewport } from "next";
import "@fontsource-variable/noto-sans-sc/wght.css";
import "./globals.css";
import "./art-direction.css";

export const metadata: Metadata = {
  title: "MAKEBOOK · 造物簿",
  description:
    "AI 编译需求，消费者预锁资金，工厂提交 MOQ 报价，Injective 公开清算。",
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  themeColor: "#DFE3E6",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <body>{children}</body>
    </html>
  );
}

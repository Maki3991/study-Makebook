import type { Metadata, Viewport } from "next";
import "./globals.css";
import "@rainbow-me/rainbowkit/styles.css";
import { ProvidersShell } from "@/app/components/site/providers-shell";
import { TopBar } from "@/app/components/site/top-bar";
import { TestnetBanner } from "@/app/components/site/testnet-banner";

export const metadata: Metadata = {
  title: "MAKEBOOK — Production Demand Clearing",
  description:
    "Name your max price. Factories produce to real demand. On Injective testnet.",
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
  openGraph: {
    title: "MAKEBOOK",
    description: "Name your max price. Factories produce to real demand.",
    images: ["/products/frame-01/og-share.png"],
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "MAKEBOOK",
    description: "Name your max price. Factories produce to real demand.",
    images: ["/products/frame-01/og-share.png"],
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#ffffff",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className="min-h-dvh bg-canvas text-ink">
        <ProvidersShell>
          <TopBar />
          <TestnetBanner />
          {children}
        </ProvidersShell>
      </body>
    </html>
  );
}

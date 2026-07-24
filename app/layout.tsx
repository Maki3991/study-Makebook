import type { Metadata, Viewport } from "next";
import "@fontsource-variable/noto-sans-sc/wght.css";
import "./globals.css";
import { WalletProvider } from "@/app/components/site/wallet-provider";
import { TopBar } from "@/app/components/site/top-bar";

// NOTE: the legacy art-direction.css was removed together with the old
// story-flow site; globals.css is the single design system now.

export const metadata: Metadata = {
  title: "MAKEBOOK — FRAME-01 | Production Demand Clearing",
  description:
    "FRAME-01 is the first MAKEBOOK production run. Back real demand for a precision-engineered product: pledge your max price, watch factories compete, and let the batch clear at one uniform price on Injective — refunds and payouts settle onchain.",
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#dfe3e6",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <WalletProvider>
          <TopBar />
          {children}
        </WalletProvider>
      </body>
    </html>
  );
}

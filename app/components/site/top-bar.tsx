"use client";

import Link from "next/link";
import { WalletButton } from "./wallet-button";
import { useCopy } from "@/app/lib/i18n/use-copy";
import { useLanguage } from "@/app/lib/i18n/context";

export function TopBar() {
  const copy = useCopy();
  const { language, toggleLanguage } = useLanguage();

  return (
    <header className="sticky top-0 z-40 border-b border-line bg-canvas/95 backdrop-blur-none">
      <div className="page flex h-16 items-center justify-between gap-4">
        <Link href="/" className="inline-flex items-center">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/makebook-logo.png"
            alt={copy.global.nav.brand}
            className="h-8 w-auto"
          />
        </Link>

        <nav className="flex items-center gap-1 sm:gap-3">
          <Link
            href="/orders"
            className="rounded-md px-3 py-2 text-sm font-medium text-ink-2 transition-colors hover:bg-surface hover:text-ink inline-flex"
          >
            {copy.global.nav.orders}
          </Link>
          <Link
            href="/console"
            className="rounded-md px-3 py-2 text-sm font-medium text-ink-2 transition-colors hover:bg-surface hover:text-ink inline-flex"
          >
            {copy.global.nav.console}
          </Link>
          <button
            type="button"
            onClick={toggleLanguage}
            className="rounded-md px-2 py-1 text-sm font-medium text-ink-2 hover:bg-surface"
            aria-label={copy.global.a11y.toggleLanguage}
          >
            {language === "en" ? "EN" : "中"}
          </button>
          <WalletButton />
        </nav>
      </div>
    </header>
  );
}

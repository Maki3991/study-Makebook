"use client";

import { useState } from "react";
import Link from "next/link";
import { Menu, X } from "lucide-react";
import { WalletButton } from "./wallet-button";
import { LanguageSwitch } from "./language-switch";
import { useCopy } from "@/app/lib/i18n/use-copy";

const NAV_LINK_CLASS =
  "inline-flex shrink-0 items-center whitespace-nowrap rounded-md px-3 py-2 text-sm font-medium text-ink-2 transition-colors hover:bg-surface hover:text-ink";

const DRAWER_LINK_CLASS =
  "flex items-center whitespace-nowrap border-b border-line py-3 text-sm font-medium text-ink";

export function TopBar() {
  const copy = useCopy();
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    // bg-canvas is fully opaque (N-1): scrolled content must not show through.
    <header className="sticky top-0 z-40 border-b border-line bg-canvas">
      <div className="page flex h-16 items-center justify-between gap-3">
        <Link
          href="/"
          className="inline-flex shrink-0 items-center"
          onClick={() => setMenuOpen(false)}
        >
          {/* N-14: transparent brand mark below 768px; the white-backed
              horizontal logo would show a white patch on the paper canvas.
              Note: h-8/w-8 would resolve to --spacing-8 (128px) in this
              theme — h-9/w-9 is the 36px size that fits the 64px bar. */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/brand/mark-128.png"
            alt={copy.global.nav.brand}
            className="h-9 w-9 shrink-0 md:hidden"
          />
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/makebook-logo.png"
            alt={copy.global.nav.brand}
            className="hidden h-9 w-auto shrink-0 md:block"
          />
        </Link>

        {/* Desktop nav (≥768px) */}
        <nav className="hidden shrink-0 items-center gap-3 md:flex">
          <Link href="/orders" className={NAV_LINK_CLASS}>
            {copy.global.nav.orders}
          </Link>
          <Link href="/console" className={NAV_LINK_CLASS}>
            {copy.global.nav.console}
          </Link>
          <LanguageSwitch />
          <WalletButton />
        </nav>

        {/* Mobile (<768px): wallet stays in the bar, nav goes into the drawer */}
        <div className="flex shrink-0 items-center gap-2 md:hidden">
          <WalletButton />
          <button
            type="button"
            onClick={() => setMenuOpen((open) => !open)}
            aria-expanded={menuOpen}
            aria-label={
              menuOpen ? copy.global.a11y.close : copy.global.a11y.openMenu
            }
            className="inline-flex items-center justify-center text-ink"
          >
            {menuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      {/* Mobile drawer — absolute so opening it does not reflow the page. */}
      {menuOpen ? (
        <nav className="absolute inset-x-0 top-full border-b border-line bg-canvas md:hidden">
          <div className="page flex flex-col py-2">
            <Link
              href="/orders"
              onClick={() => setMenuOpen(false)}
              className={DRAWER_LINK_CLASS}
            >
              {copy.global.nav.orders}
            </Link>
            <Link
              href="/console"
              onClick={() => setMenuOpen(false)}
              className={DRAWER_LINK_CLASS}
            >
              {copy.global.nav.console}
            </Link>
            <div className="flex items-center py-2">
              <LanguageSwitch onSelected={() => setMenuOpen(false)} />
            </div>
          </div>
        </nav>
      ) : null}
    </header>
  );
}

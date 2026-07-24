"use client";

import Link from "next/link";
import { WalletButton } from "./wallet-button";
import { copy } from "@/app/lib/copy";

export function TopBar() {
  return (
    <header className="sticky top-0 z-40 border-b border-line bg-canvas/95 backdrop-blur-none">
      <div className="page flex h-16 items-center justify-between gap-4">
        <Link
          href="/"
          className="flex items-center gap-2 text-lg font-semibold tracking-tight text-ink"
        >
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            aria-hidden="true"
          >
            <path
              d="M4 20V4h4l4 8 4-8h4v16h-3V8.5l-3.5 6.5h-3L7 8.5V20H4Z"
              fill="currentColor"
            />
          </svg>
          {copy.global.nav.brand}
        </Link>

        <nav className="flex items-center gap-1 sm:gap-3">
          <Link
            href="/orders"
            className="hidden rounded-md px-3 py-2 text-sm font-medium text-ink-2 transition-colors hover:bg-surface hover:text-ink sm:inline-flex"
          >
            {copy.global.nav.orders}
          </Link>
          <Link
            href="/console"
            className="hidden rounded-md px-3 py-2 text-sm font-medium text-ink-2 transition-colors hover:bg-surface hover:text-ink sm:inline-flex"
          >
            {copy.global.nav.console}
          </Link>
          <WalletButton />
        </nav>
      </div>
    </header>
  );
}

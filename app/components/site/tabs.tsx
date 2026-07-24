"use client";

import { ChevronRight } from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";

/**
 * Generic campaign tabs.
 * - lg and up: a real tab list; only the active panel renders visible.
 * - Below lg: degrades to a vertical anchor list; all panels stay stacked and
 *   the links simply scroll to them.
 * Hash deep links (#settlement from the status-bar CTA) activate the matching
 * tab; tab clicks update the hash via replaceState so no scroll jump occurs.
 */

export interface TabItem {
  /** Anchor id, also the deep-link hash (e.g. "settlement"). */
  id: string;
  /** Mono kicker, e.g. "01". */
  index: string;
  label: string;
  content: ReactNode;
}

export function Tabs({
  items,
  ariaLabel = "Campaign sections",
}: {
  items: TabItem[];
  ariaLabel?: string;
}) {
  const [active, setActive] = useState(items[0]?.id ?? "");

  // Hash sync: external anchors (status bar, footer links) both activate the
  // tab and scroll to it. The panel may have just become visible, so the
  // scroll runs after React commits the activation.
  useEffect(() => {
    const syncFromHash = () => {
      const id = window.location.hash.slice(1);
      if (!items.some((item) => item.id === id)) return;
      setActive(id);
      requestAnimationFrame(() => {
        document
          .getElementById(id)
          ?.scrollIntoView({ behavior: "smooth", block: "start" });
      });
    };
    syncFromHash();
    window.addEventListener("hashchange", syncFromHash);
    return () => window.removeEventListener("hashchange", syncFromHash);
  }, [items]);

  const select = (id: string) => {
    setActive(id);
    window.history.replaceState(null, "", `#${id}`);
  };

  return (
    <div className="flex flex-col">
      {/* mobile: vertical anchor list */}
      <nav aria-label={ariaLabel} className="flex flex-col gap-2 lg:hidden">
        {items.map((item) => (
          <a
            key={item.id}
            href={`#${item.id}`}
            className="surface-flat flex min-h-[44px] items-center justify-between gap-3 px-4 py-3"
          >
            <span className="flex items-baseline gap-3">
              <span className="num text-11 font-medium tracking-[0.14em] text-n-40">
                {item.index}
              </span>
              <span className="text-15 font-medium text-n-92">{item.label}</span>
            </span>
            <ChevronRight size={15} className="shrink-0 text-n-40" aria-hidden="true" />
          </a>
        ))}
      </nav>

      {/* lg+: tab list */}
      <div
        role="tablist"
        aria-label={ariaLabel}
        className="hidden lg:flex lg:gap-8 lg:border-b lg:border-n-22"
      >
        {items.map((item) => {
          const selected = item.id === active;
          return (
            <button
              key={item.id}
              type="button"
              role="tab"
              id={`tab-${item.id}`}
              aria-selected={selected}
              aria-controls={item.id}
              onClick={() => select(item.id)}
              className={`-mb-px flex min-h-0 items-baseline gap-2 border-b-2 px-1 pt-1 pb-3 transition-colors ${
                selected
                  ? "border-azure text-n-92"
                  : "border-transparent text-n-52 hover:text-n-92"
              }`}
            >
              <span className="num text-11 font-medium tracking-[0.14em] text-n-40">
                {item.index}
              </span>
              <span className="text-15 font-medium">{item.label}</span>
            </button>
          );
        })}
      </div>

      {/* panels: stacked on mobile, active-only from lg up */}
      <div className="flex flex-col gap-16 pt-10 lg:pt-14">
        {items.map((item) => (
          <section
            key={item.id}
            id={item.id}
            role="tabpanel"
            aria-labelledby={`tab-${item.id}`}
            className={
              item.id === active ? "scroll-mt-24" : "scroll-mt-24 lg:hidden"
            }
          >
            {item.content}
          </section>
        ))}
      </div>
    </div>
  );
}

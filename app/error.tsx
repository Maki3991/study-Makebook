"use client";

import Link from "next/link";
import { useCopy } from "@/app/lib/i18n/use-copy";

// Spec 009 §5-10: app-level error boundary. Among other things this catches
// parseCampaignState() throwing on an unknown on-chain state value.
export default function ErrorPage({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const copy = useCopy();

  return (
    <main className="page py-20 text-center">
      <h1 className="text-h2 font-semibold text-ink lg:text-h1">
        {copy.global.errorPage.title}
      </h1>
      <p className="mx-auto mt-3 max-w-md text-ink-2">
        {copy.global.errorPage.body}
      </p>
      <div className="mt-8 flex items-center justify-center gap-3">
        <button type="button" onClick={reset} className="btn btn-primary">
          {copy.global.errorPage.retry}
        </button>
        <Link href="/" className="btn btn-secondary">
          {copy.global.errorPage.home}
        </Link>
      </div>
    </main>
  );
}

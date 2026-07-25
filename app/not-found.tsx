"use client";

import Link from "next/link";
import { useCopy } from "@/app/lib/i18n/use-copy";

// Spec 009 §5-10: app-level 404 (e.g. /campaigns/<unknown-id> calls notFound()).
export default function NotFound() {
  const copy = useCopy();

  return (
    <main className="page py-20 text-center">
      <h1 className="text-h2 font-semibold text-ink lg:text-h1">
        {copy.global.notFound.title}
      </h1>
      <p className="mx-auto mt-3 max-w-md text-ink-2">
        {copy.global.notFound.body}
      </p>
      <Link href="/" className="btn btn-primary mt-8 inline-flex">
        {copy.global.notFound.home}
      </Link>
    </main>
  );
}

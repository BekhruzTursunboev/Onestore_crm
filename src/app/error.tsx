"use client";

import Link from "next/link";
import { AlertTriangle, RefreshCcw } from "lucide-react";
import { useEffect } from "react";

export default function AppError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("App route failed:", error);
  }, [error]);

  return (
    <section className="flex min-h-[70vh] items-center justify-center px-4">
      <div className="w-full max-w-xl rounded-2xl border border-red-500/20 bg-red-500/[0.06] p-8 text-center shadow-2xl shadow-black/30">
        <div className="mx-auto flex size-12 items-center justify-center rounded-full border border-red-400/30 bg-red-500/10 text-red-200">
          <AlertTriangle size={22} />
        </div>
        <h1 className="mt-5 text-2xl font-semibold tracking-tight text-white">Sahifa yuklanmadi</h1>
        <p className="mx-auto mt-3 max-w-[42ch] text-sm leading-6 text-white/55">
          Server vaqtincha javob bermadi. Qayta urinib ko&apos;ring yoki boshqaruv paneliga qayting.
        </p>
        {error.digest ? (
          <p className="mt-4 font-mono text-[11px] uppercase tracking-widest text-white/35">Error ID: {error.digest}</p>
        ) : null}
        <div className="mt-7 flex flex-col justify-center gap-3 sm:flex-row">
          <button
            className="focus-ring inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-white px-5 text-sm font-semibold text-black transition-colors hover:bg-white/90"
            onClick={reset}
            type="button"
          >
            <RefreshCcw size={16} />
            Qayta urinish
          </button>
          <Link
            className="focus-ring inline-flex h-11 items-center justify-center rounded-xl border border-white/10 bg-white/[0.04] px-5 text-sm font-medium text-white/75 transition-colors hover:bg-white/[0.08] hover:text-white"
            href="/"
          >
            Dashboardga qaytish
          </Link>
        </div>
      </div>
    </section>
  );
}

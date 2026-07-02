import Link from "next/link";
import { SearchX } from "lucide-react";

export default function NotFound() {
  return (
    <section className="flex min-h-[70vh] items-center justify-center px-4">
      <div className="w-full max-w-xl rounded-2xl border border-white/10 bg-white/[0.035] p-8 text-center shadow-2xl shadow-black/30">
        <div className="mx-auto flex size-12 items-center justify-center rounded-full border border-white/10 bg-white/5 text-white/65">
          <SearchX size={22} />
        </div>
        <h1 className="mt-5 text-2xl font-semibold tracking-tight text-white">Sahifa topilmadi</h1>
        <p className="mx-auto mt-3 max-w-[42ch] text-sm leading-6 text-white/55">
          Bu mijoz yoki sahifa mavjud emas. Dashboard orqali kerakli bo&apos;limga qayting.
        </p>
        <Link
          className="focus-ring mt-7 inline-flex h-11 items-center justify-center rounded-xl bg-white px-5 text-sm font-semibold text-black transition-colors hover:bg-white/90"
          href="/"
        >
          Dashboardga qaytish
        </Link>
      </div>
    </section>
  );
}

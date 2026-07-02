"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Gift,
  Gauge,
  UsersRound,
} from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/", label: "Boshqaruv", icon: Gauge },
  { href: "/clients", label: "Mijozlar", icon: UsersRound },
  { href: "/giveaway", label: "Sovrin", icon: Gift },
];

function isActivePath(pathname: string, href: string) {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}

export default function ShellNavigation() {
  const pathname = usePathname();

  return (
    <>
      <aside className="hidden w-[280px] shrink-0 flex-col md:flex doppelrand">
        <div className="doppelrand-inner relative z-10 flex flex-col p-6">
          <Link href="/" className="focus-ring group mb-12 flex items-center gap-4 rounded-2xl">
            <div className="flex size-12 items-center justify-center overflow-hidden rounded-full bg-white/5 ring-1 ring-white/10 transition-all duration-500 ease-out group-hover:scale-105 group-hover:ring-white/20">
              <Image src="/logo.jpg" alt="OneStore" width={40} height={40} className="size-10 rounded-full object-cover" priority />
            </div>
            <div className="flex flex-col">
              <span className="text-lg font-medium leading-tight tracking-tight text-white">OneStore</span>
              <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-white/40">Ichki CRM</span>
            </div>
          </Link>

          <nav className="flex flex-1 flex-col gap-2" aria-label="Asosiy menyu">
            {navItems.map((item) => {
              const Icon = item.icon;
              const active = isActivePath(pathname, item.href);

              return (
                <Link
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "focus-ring group flex min-h-11 items-center gap-4 rounded-2xl px-4 py-3 text-[15px] font-medium transition-all duration-200",
                    active
                      ? "bg-[var(--cs-accent-soft)] text-white shadow-[inset_3px_0_0_var(--cs-accent)]"
                      : "text-white/60 hover:bg-white/[0.045] hover:text-white",
                  )}
                  href={item.href}
                  key={item.href}
                >
                  <Icon className={cn("transition-colors duration-200", active ? "text-[var(--cs-accent)]" : "text-white/40 group-hover:text-white")} strokeWidth={1.8} />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>

          <div className="mt-auto flex items-center justify-between border-t border-white/5 pt-6">
            <div className="flex items-center gap-3">
              <span className="relative flex size-2 rounded-full bg-[var(--cs-success-soft)]">
                <span className="absolute inset-0 rounded-full bg-[var(--cs-success)] opacity-70 motion-safe:animate-ping" />
                <span className="relative m-auto size-1 rounded-full bg-[var(--cs-success)]" />
              </span>
              <span className="font-mono text-[10px] uppercase tracking-widest text-white/40">Tizim faol</span>
            </div>
          </div>
        </div>
      </aside>

      <nav className="doppelrand md:hidden" aria-label="Mobil menyu">
        <div className="custom-scrollbar doppelrand-inner flex gap-1 overflow-x-auto p-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = isActivePath(pathname, item.href);

            return (
              <Link
                aria-current={active ? "page" : undefined}
                className={cn(
                  "focus-ring flex min-h-[54px] min-w-[86px] shrink-0 flex-col items-center justify-center gap-1 rounded-2xl px-3 py-2 text-[10px] font-medium transition-colors",
                  active ? "bg-[var(--cs-accent-soft)] text-[var(--cs-accent)]" : "text-white/45 hover:bg-white/5 hover:text-white",
                )}
                href={item.href}
                key={item.href}
                title={item.label}
              >
                <Icon size={18} strokeWidth={1.8} />
                <span className="leading-none">{item.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
}

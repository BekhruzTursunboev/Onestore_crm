"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";
import AddClientForm from "./AddClientForm";

interface Client {
  id: string;
  name: string;
  phone: string | null;
  telegram: string | null;
  totalSpent: number;
  createdAt: string;
}

function formatDate(date: string) {
  return new Date(date).toLocaleDateString("uz-Latn-UZ", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export default function ClientsPage() {
  const [clients, setClients] = useState<Client[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const router = useRouter();

  const loadClients = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/clients");
      if (!res.ok) throw new Error("Mijozlar yuklanmadi");
      const data = await res.json();
      setClients(data);
    } catch {
      setError("Mijozlar bazasi yuklanmadi. Sahifani yangilang.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadClients();
    }, 0);

    return () => window.clearTimeout(timer);
  }, [loadClients]);

  const filteredClients = useMemo(() => {
    if (!searchQuery.trim()) return clients;

    const lowerQuery = searchQuery.toLowerCase();
    return clients.filter((client) =>
      client.name.toLowerCase().includes(lowerQuery) ||
      client.id.toLowerCase().includes(lowerQuery) ||
      (client.telegram ?? "").toLowerCase().includes(lowerQuery) ||
      (client.phone ?? "").toLowerCase().includes(lowerQuery)
    );
  }, [clients, searchQuery]);

  return (
    <div className="flex w-full flex-col gap-8">
      <div className="flex flex-col gap-6 rounded-[2rem] border border-white/10 bg-white/[0.025] p-5 md:flex-row md:items-end md:justify-between md:p-6">
        <div className="flex flex-col gap-3">
          <div className="inline-flex w-max items-center rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[11px] font-medium uppercase tracking-[0.2em] text-white/60">
            Baza
          </div>
          <h1 className="text-4xl font-semibold tracking-[-0.03em] text-white md:text-5xl">Mijozlar</h1>
          <div className="flex flex-wrap gap-3 text-sm text-white/50">
            <span>{clients.length} ta mijoz</span>
            <span className="text-white/20">/</span>
            <span>{filteredClients.length} ta ko&apos;rinmoqda</span>
          </div>
        </div>

        <div className="flex w-full flex-col gap-3 md:w-auto md:min-w-[560px] md:flex-row md:items-center md:justify-end">
          <div className="relative w-full md:flex-1">
            <div className="doppelrand-inner relative flex items-center rounded-2xl px-4 py-3 ring-1 ring-white/10 transition-all focus-within:ring-red-500/30">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40" size={18} />
              <input
                className="w-full border-none bg-transparent py-1 pl-8 text-[15px] text-white outline-none placeholder:text-white/30"
                onChange={(event) => setSearchQuery(event.target.value)}
                placeholder="Ism, ID, telefon yoki Telegram"
                type="text"
                value={searchQuery}
              />
            </div>
          </div>
          <AddClientForm onCreated={loadClients} />
        </div>
      </div>

      <div className="doppelrand w-full">
        <div className="doppelrand-inner overflow-hidden">
          {error ? (
            <div className="p-10 text-center text-sm text-red-200">{error}</div>
          ) : loading ? (
            <div className="flex flex-col gap-3 p-6">
              {Array.from({ length: 7 }).map((_, index) => (
                <div className="h-14 rounded-2xl bg-white/[0.045]" key={index} />
              ))}
            </div>
          ) : (
            <>
              <div className="grid gap-3 p-4 md:hidden">
                {filteredClients.length > 0 ? (
                  filteredClients.map((client) => (
                    <button
                      className="rounded-2xl border border-white/10 bg-white/[0.025] p-4 text-left transition-colors active:bg-white/[0.06]"
                      key={client.id}
                      onClick={() => router.push(`/clients/${client.id}`)}
                      type="button"
                    >
                      <div>
                        <p className="font-mono text-[11px] uppercase tracking-widest text-white/35">{client.id.substring(0, 8)}</p>
                        <h2 className="mt-2 text-lg font-semibold leading-tight text-white">{client.name}</h2>
                      </div>
                      <div className="mt-4 grid gap-2 text-sm text-white/55">
                        <span>{client.phone || client.telegram || "Aloqa kiritilmagan"}</span>
                        <span>{formatDate(client.createdAt)}</span>
                        <strong className="font-mono text-base text-[var(--cs-success)]">${client.totalSpent.toFixed(2)} jami xarid</strong>
                      </div>
                    </button>
                  ))
                ) : (
                  <div className="py-20 text-center text-sm text-white/40">Mijoz topilmadi</div>
                )}
              </div>

              <div className="hidden w-full overflow-x-auto md:block">
                <table className="w-full border-collapse text-left">
                  <thead>
                    <tr className="border-b border-white/5">
                      <th className="px-6 py-4 text-[11px] font-medium uppercase tracking-widest text-white/40">ID</th>
                      <th className="px-6 py-4 text-[11px] font-medium uppercase tracking-widest text-white/40">Ism</th>
                      <th className="px-6 py-4 text-[11px] font-medium uppercase tracking-widest text-white/40">Aloqa</th>
                      <th className="px-6 py-4 text-[11px] font-medium uppercase tracking-widest text-white/40">Jami xarid</th>
                      <th className="px-6 py-4 text-[11px] font-medium uppercase tracking-widest text-white/40">Qo&apos;shilgan</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {filteredClients.length > 0 ? (
                      filteredClients.map((client) => (
                        <tr
                          className="group cursor-pointer transition-colors duration-200 hover:bg-white/[0.035]"
                          key={client.id}
                          onClick={() => router.push(`/clients/${client.id}`)}
                        >
                          <td className="px-6 py-5 font-mono text-sm text-white/40 transition-colors group-hover:text-white/60">
                            {client.id.substring(0, 8)}
                          </td>
                          <td className="px-6 py-5 text-[15px] font-semibold text-white/90 transition-colors group-hover:text-white">
                            {client.name}
                          </td>
                          <td className="px-6 py-5 text-[15px] text-white/60">
                            {client.phone || client.telegram || "Kiritilmagan"}
                          </td>
                          <td className="px-6 py-5 font-mono text-[15px] text-white/80">
                            ${client.totalSpent.toFixed(2)}
                          </td>
                          <td className="px-6 py-5 text-sm text-white/50">{formatDate(client.createdAt)}</td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td className="py-24 text-center text-sm text-white/40" colSpan={5}>
                          Mijoz topilmadi
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

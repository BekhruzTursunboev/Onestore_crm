"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ArrowRight, Crown, RotateCcw, Shuffle, Sparkles, Ticket, Trophy, UsersRound, X } from "lucide-react";

type GiveawayClient = {
  id: string;
  name: string;
  phone: string | null;
  telegram: string | null;
  totalSpent: number;
  transactions: Array<{ id: string; price: number; item: string; status: string }>;
};

type GiveawayRandomizerProps = {
  clients: GiveawayClient[];
};

function formatUsd(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value);
}

function ticketCount(client: GiveawayClient) {
  const completedTrades = client.transactions.filter((trade) => trade.status === "COMPLETED").length;
  const spendTickets = Math.floor(client.totalSpent / 500);
  return Math.max(1, Math.min(20, completedTrades + spendTickets));
}

function secureRandom() {
  if (typeof window === "undefined" || !window.crypto) return Math.random();
  const values = new Uint32Array(1);
  window.crypto.getRandomValues(values);
  return values[0] / 4294967296;
}

function pickWinner(pool: GiveawayClient[]) {
  const totalTickets = pool.reduce((sum, client) => sum + ticketCount(client), 0);
  let cursor = secureRandom() * totalTickets;

  for (const client of pool) {
    cursor -= ticketCount(client);
    if (cursor <= 0) return client;
  }

  return pool[0] ?? null;
}

export default function GiveawayRandomizer({ clients }: GiveawayRandomizerProps) {
  const [winner, setWinner] = useState<GiveawayClient | null>(null);
  const [rolling, setRolling] = useState(false);
  const [rollCount, setRollCount] = useState(0);
  const [showWinner, setShowWinner] = useState(false);

  const eligibleClients = useMemo(
    () => clients.filter((client) => client.transactions.some((trade) => trade.status === "COMPLETED")),
    [clients],
  );

  const streamClients = useMemo(() => {
    const source = eligibleClients.length > 0 ? eligibleClients : clients;
    if (source.length === 0) return [];
    return Array.from({ length: 48 }, (_, index) => source[index % source.length]);
  }, [clients, eligibleClients]);

  const totalTickets = useMemo(
    () => eligibleClients.reduce((sum, client) => sum + ticketCount(client), 0),
    [eligibleClients],
  );

  function runRandomizer() {
    if (eligibleClients.length === 0 || rolling) return;

    setRolling(true);
    setWinner(null);
    setShowWinner(false);

    window.setTimeout(() => {
      const selectedWinner = pickWinner(eligibleClients);
      setWinner(selectedWinner);
      setRolling(false);
      setShowWinner(true);
      setRollCount((value) => value + 1);
    }, 2300);
  }

  function resetWinner() {
    setWinner(null);
    setShowWinner(false);
  }

  return (
    <div className="flex w-full max-w-full flex-col gap-8 overflow-hidden">
      <section className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="flex min-w-0 flex-col justify-between rounded-[2rem] border border-white/10 bg-white/[0.025] p-6 md:p-8">
          <div>
            <div className="mb-8 flex items-center gap-3">
              <div className="flex size-11 items-center justify-center rounded-2xl border border-red-500/20 bg-red-500/10 text-red-200">
                <Sparkles size={20} />
              </div>
              <div>
                <p className="text-[11px] font-medium uppercase tracking-[0.2em] text-white/40">OneStore sovrin</p>
                <h1 className="text-4xl font-semibold tracking-[-0.03em] text-white md:text-5xl">Sovrin tanlash</h1>
              </div>
            </div>

            <p className="mb-8 max-w-[56ch] text-sm leading-6 text-white/50">
              G&apos;olib yakunlangan xaridi bor mijozlar orasidan tanlanadi. Chiptalar soni xaridlar soni va jami xarid summasiga qarab hisoblanadi.
            </p>
          </div>

          <div className="overflow-hidden rounded-[2rem] border border-white/10 bg-black/35 p-4">
            <div className="relative h-36 overflow-hidden rounded-[1.5rem] border border-white/10 bg-white/[0.025]">
              <div className="pointer-events-none absolute left-1/2 top-0 z-10 h-full w-px bg-red-400 shadow-[0_0_28px_rgba(248,113,113,0.65)]" />
              <div className={`absolute left-4 top-1/2 flex -translate-y-1/2 items-center gap-3 ${rolling ? "giveaway-stream" : ""}`}>
                {streamClients.length > 0 ? (
                  streamClients.map((client, index) => (
                    <div className="flex min-w-[220px] flex-col gap-2 rounded-2xl border border-white/10 bg-[#111] p-4" key={`${client.id}-${index}`}>
                      <span className="truncate text-[15px] font-semibold text-white">{client.name}</span>
                      <span className="truncate text-xs text-white/40">{client.telegram || client.phone || client.id.slice(0, 8)}</span>
                      <span className="w-max rounded-full border border-white/10 bg-white/5 px-2 py-1 font-mono text-[11px] text-white/55">
                        {ticketCount(client)} chipta
                      </span>
                    </div>
                  ))
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-sm text-white/40">Mijozlar bazasi bo&apos;sh.</div>
                )}
              </div>
            </div>
          </div>

          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            <button
              className="inline-flex flex-1 items-center justify-center gap-3 rounded-2xl border border-red-400/30 bg-red-500 px-5 py-4 text-[15px] font-semibold text-white shadow-[0_18px_55px_rgba(239,68,68,0.22)] transition-all duration-200 hover:-translate-y-0.5 hover:bg-red-400 active:translate-y-0 disabled:pointer-events-none disabled:opacity-50"
              disabled={eligibleClients.length === 0 || rolling}
              onClick={runRandomizer}
              type="button"
            >
              <Shuffle size={18} />
              {rolling ? "Tanlanmoqda" : "G'olibni tanlash"}
            </button>
            <button
              className="inline-flex items-center justify-center gap-3 rounded-2xl border border-white/10 px-5 py-4 text-[15px] font-medium text-white/70 transition-colors hover:bg-white/[0.06] hover:text-white"
              onClick={resetWinner}
              type="button"
            >
              <RotateCcw size={18} />
              Tozalash
            </button>
          </div>
        </div>

        <aside className="doppelrand min-w-0">
          <div className="doppelrand-inner flex min-h-[420px] flex-col justify-between p-7">
            <div className="flex flex-col gap-6">
              <div className="flex size-16 items-center justify-center rounded-3xl border border-white/10 bg-white/5 text-white/60">
                <Crown size={30} />
              </div>
              <div>
                <p className="mb-3 text-[11px] font-medium uppercase tracking-[0.2em] text-white/40">Qoidalar</p>
                <h2 className="text-2xl font-semibold tracking-[-0.03em] text-white">Sovrin tizimi</h2>
              </div>
              <p className="text-sm leading-6 text-white/50">
                Faqat kamida bitta yakunlangan xaridi bor mijozlar qatnashadi. Ko&apos;p xarid qilgan mijozlarning chipta soni ko&apos;proq bo&apos;ladi.
              </p>
            </div>

            <div className="mt-8 grid grid-cols-3 gap-3 border-t border-white/10 pt-5">
              <div>
                <UsersRound className="mb-2 text-white/40" size={18} />
                <strong className="block font-mono text-xl text-white">{eligibleClients.length}</strong>
                <span className="text-xs text-white/40">ishtirokchi</span>
              </div>
              <div>
                <Ticket className="mb-2 text-white/40" size={18} />
                <strong className="block font-mono text-xl text-white">{totalTickets}</strong>
                <span className="text-xs text-white/40">chipta</span>
              </div>
              <div>
                <Shuffle className="mb-2 text-white/40" size={18} />
                <strong className="block font-mono text-xl text-white">{rollCount}</strong>
                <span className="text-xs text-white/40">urinish</span>
              </div>
            </div>
          </div>
        </aside>
      </section>

      <section className="doppelrand">
        <div className="doppelrand-inner flex flex-col gap-6 p-6">
          <div className="flex flex-col justify-between gap-3 border-b border-white/5 pb-4 md:flex-row md:items-center">
            <div>
              <h2 className="text-xl font-medium text-white">Ishtirokchilar va chiptalar</h2>
              <p className="mt-1 text-xs text-white/40">G&apos;oliblik ehtimoli chiptalar soniga mutanosib taqsimlangan.</p>
            </div>
            <span className="w-max rounded bg-white/5 px-2 py-1 font-mono text-xs text-white/40">{eligibleClients.length} ta faol</span>
          </div>

          <div className="custom-scrollbar overflow-x-auto">
            <table className="w-full min-w-[720px] border-collapse text-left text-sm text-white/70">
              <thead>
                <tr className="border-b border-white/5 font-mono text-[11px] uppercase tracking-widest text-white/35">
                  <th className="px-4 py-3">Mijoz</th>
                  <th className="px-4 py-3">Aloqa</th>
                  <th className="px-4 py-3">Jami xarid</th>
                  <th className="px-4 py-3">Ehtimollik</th>
                  <th className="px-4 py-3">Chipta</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {eligibleClients
                  .slice()
                  .sort((a, b) => ticketCount(b) - ticketCount(a))
                  .map((client) => {
                    const probability = totalTickets > 0 ? Math.round((ticketCount(client) / totalTickets) * 100) : 0;
                    return (
                      <tr className="transition-colors hover:bg-white/[0.015]" key={client.id}>
                        <td className="px-4 py-3.5 font-medium text-white">
                          <Link className="transition-colors hover:text-red-300" href={`/clients/${client.id}`}>
                            {client.name}
                          </Link>
                        </td>
                        <td className="px-4 py-3.5 font-mono text-white/40">{client.telegram || client.phone || "-"}</td>
                        <td className="px-4 py-3.5 font-mono">{formatUsd(client.totalSpent)}</td>
                        <td className="px-4 py-3.5">
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-white/80">{probability}%</span>
                            <div className="hidden h-1.5 w-16 overflow-hidden rounded-full bg-white/5 sm:block">
                              <div className="h-full bg-red-500" style={{ width: `${probability}%` }} />
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3.5">
                          <span className="inline-flex items-center gap-1.5 rounded-full border border-red-500/20 bg-red-500/10 px-2.5 py-1 font-mono text-xs text-red-200">
                            <Ticket size={12} />
                            {ticketCount(client)}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                {eligibleClients.length === 0 && (
                  <tr>
                    <td className="py-12 text-center font-mono text-white/30" colSpan={5}>
                      Faol ishtirokchilar mavjud emas. Mijozning kamida bitta yakunlangan xaridi bo&apos;lishi shart.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {showWinner && winner && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4 backdrop-blur-2xl animate-in fade-in duration-300">
          <div className="relative w-full max-w-xl animate-in zoom-in-95 duration-500">
            <div className="absolute inset-0 -z-10 rounded-[2.5rem] bg-red-500/10 blur-[80px]" />
            <div className="doppelrand">
              <div className="doppelrand-inner flex flex-col gap-6 p-7 md:p-8">
                <button
                  aria-label="Yopish"
                  className="absolute right-5 top-5 flex size-10 items-center justify-center rounded-full border border-white/10 bg-black/60 text-white/60 transition-colors hover:text-white"
                  onClick={() => setShowWinner(false)}
                  type="button"
                >
                  <X size={18} />
                </button>

                <div className="flex size-16 items-center justify-center rounded-3xl border border-red-500/30 bg-red-500/10 text-red-300">
                  <Trophy size={34} />
                </div>
                <div>
                  <p className="mb-3 font-mono text-xs uppercase tracking-[0.25em] text-red-300">G&apos;olib aniqlandi</p>
                  <h2 className="text-4xl font-semibold tracking-[-0.03em] text-white">{winner.name}</h2>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-2xl border border-white/10 bg-white/[0.035] p-4">
                    <p className="mb-2 font-mono text-[11px] uppercase tracking-widest text-white/40">Chipta</p>
                    <strong className="font-mono text-2xl text-white">{ticketCount(winner)} ta</strong>
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-white/[0.035] p-4">
                    <p className="mb-2 font-mono text-[11px] uppercase tracking-widest text-white/40">Jami xarid</p>
                    <strong className="font-mono text-2xl text-[var(--cs-success)]">{formatUsd(winner.totalSpent)}</strong>
                  </div>
                </div>
                <div className="grid gap-2 border-t border-white/10 pt-4 text-sm">
                  <div className="flex justify-between gap-4">
                    <span className="text-white/40">Telegram</span>
                    <strong className="text-right text-white">{winner.telegram || "Ko'rsatilmagan"}</strong>
                  </div>
                  <div className="flex justify-between gap-4">
                    <span className="text-white/40">Telefon</span>
                    <strong className="text-right text-white">{winner.phone || "Ko'rsatilmagan"}</strong>
                  </div>
                </div>
                <Link
                  className="inline-flex items-center justify-center gap-3 rounded-2xl bg-white px-5 py-4 text-[15px] font-semibold text-black transition-all duration-200 hover:-translate-y-0.5 hover:bg-white/90"
                  href={`/clients/${winner.id}`}
                  onClick={() => setShowWinner(false)}
                >
                  Mijoz sahifasiga o&apos;tish
                  <ArrowRight size={18} />
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  AlertCircle,
  ArrowDownUp,
  Clock3,
  Download,
  Filter,
  Printer,
  RotateCcw,
  Search,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

type Trade = {
  id: string;
  clientId: string;
  tradeId: string | null;
  item: string;
  price: number;
  marginUsd: number;
  status: string;
  rarity: string;
  floatValue: number | null;
  paymentMethod: string;
  channel: string;
  date: string;
  client: {
    id: string;
    name: string;
    telegram: string | null;
    phone: string | null;
    steamId: string | null;
    verificationStatus: string;
    marketTier: string;
  };
};

type Client = {
  id: string;
  name: string;
  phone: string | null;
  telegram: string | null;
  steamId: string | null;
  externalId: string | null;
  verificationStatus: string;
  marketTier: string;
  notes: string | null;
  totalSpent: number;
  createdAt: string;
  updatedAt: string;
  lastSeenAt: string | null;
  transactions: Array<Omit<Trade, "client">>;
};

type DashboardProps = {
  clients: Client[];
  trades: Trade[];
  generatedAtLabel: string;
  totals: {
    revenue: number;
    margin: number;
    completed: number;
    escrow: number;
    disputed: number;
    averageOrder: number;
  };
};

const statusLabels: Record<string, string> = {
  COMPLETED: "Yakunlangan",
  ESCROW: "Escrowda",
  DISPUTED: "Nizoli",
  PENDING: "Kutilmoqda",
  CANCELLED: "Bekor qilingan",
};

function formatUsd(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value);
}

function formatShortDate(value: string) {
  const tashkentDate = new Date(new Date(value).getTime() + 5 * 60 * 60 * 1000);
  const months = ["yan", "fev", "mar", "apr", "may", "iyn", "iyl", "avg", "sen", "okt", "noy", "dek"];
  const day = String(tashkentDate.getUTCDate()).padStart(2, "0");
  const hour = String(tashkentDate.getUTCHours()).padStart(2, "0");
  const minute = String(tashkentDate.getUTCMinutes()).padStart(2, "0");

  return `${day}-${months[tashkentDate.getUTCMonth()]}, ${hour}:${minute}`;
}

function rarityColor(rarity: string) {
  const normalized = rarity.toLowerCase();
  if (normalized.includes("covert") || normalized.includes("contraband")) return "bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.5)]";
  if (normalized.includes("classified")) return "bg-fuchsia-500 shadow-[0_0_8px_rgba(217,70,239,0.5)]";
  if (normalized.includes("restricted")) return "bg-violet-500 shadow-[0_0_8px_rgba(139,92,246,0.5)]";
  if (normalized.includes("mil")) return "bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.5)]";
  return "bg-zinc-400";
}

function statusClass(status: string) {
  if (status === "COMPLETED") return "text-[var(--cs-success)] bg-[var(--cs-success-soft)] border-[hsl(158_58%_44%_/_0.24)]";
  if (status === "ESCROW" || status === "PENDING") return "text-[var(--cs-warning)] bg-[var(--cs-warning-soft)] border-[hsl(39_92%_58%_/_0.24)]";
  if (status === "DISPUTED" || status === "CANCELLED") return "text-[var(--cs-danger)] bg-[var(--cs-danger-soft)] border-[hsl(350_78%_58%_/_0.24)]";
  return "text-white/60 bg-white/5 border-white/10";
}

export default function DashboardCommandCenter({ clients, trades, generatedAtLabel, totals }: DashboardProps) {
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [priorityFilter, setPriorityFilter] = useState("ALL");
  const [sortMode, setSortMode] = useState("newest");
  const router = useRouter();

  const filteredTrades = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return trades
      .filter((trade) => {
        const matchesStatus = statusFilter === "ALL" || trade.status === statusFilter;
        if (!matchesStatus) return false;
        const matchesPriority =
          priorityFilter === "ALL" ||
          (priorityFilter === "HIGH_VALUE" && trade.price >= 1000) ||
          (priorityFilter === "REVIEW" && ["DISPUTED", "ESCROW", "PENDING"].includes(trade.status));
        if (!matchesPriority) return false;
        if (!normalized) return true;

        return [
          trade.tradeId,
          trade.id,
          trade.item,
          trade.client.name,
          trade.client.telegram,
          trade.client.phone,
        ]
          .filter(Boolean)
          .some((value) => String(value).toLowerCase().includes(normalized));
      })
      .sort((a, b) => {
        if (sortMode === "amount") return b.price - a.price;
        if (sortMode === "margin") return b.marginUsd - a.marginUsd;
        if (sortMode === "oldest") return new Date(a.date).getTime() - new Date(b.date).getTime();
        return new Date(b.date).getTime() - new Date(a.date).getTime();
      });
  }, [priorityFilter, query, sortMode, statusFilter, trades]);

  const hasFilters = query.trim().length > 0 || statusFilter !== "ALL" || priorityFilter !== "ALL" || sortMode !== "newest";

  const statusOptions = [
    { value: "ALL", label: "Barchasi", count: trades.length },
    { value: "COMPLETED", label: statusLabels.COMPLETED, count: totals.completed },
    { value: "ESCROW", label: statusLabels.ESCROW, count: trades.filter((trade) => trade.status === "ESCROW" || trade.status === "PENDING").length },
    { value: "DISPUTED", label: statusLabels.DISPUTED, count: totals.disputed },
  ];

  const priorityOptions = [
    { value: "ALL", label: "Barchasi", count: trades.length },
    { value: "HIGH_VALUE", label: "Katta savdolar ($1k+)", count: trades.filter((trade) => trade.price >= 1000).length },
    { value: "REVIEW", label: "Tekshiruvdagilar", count: trades.filter((trade) => ["DISPUTED", "ESCROW", "PENDING"].includes(trade.status)).length },
  ];

  function clearFilters() {
    setQuery("");
    setStatusFilter("ALL");
    setPriorityFilter("ALL");
    setSortMode("newest");
  }

  function handlePrint() {
    if (typeof window !== "undefined") {
      window.print();
    }
  }

  return (
    <div className="w-full flex flex-col gap-8 print:p-0">
      
      {/* Top Search & Action Bar */}
      <section className="flex flex-col gap-3 rounded-2xl border border-[var(--cs-panel-border)] bg-white/[0.025] p-3 lg:flex-row lg:items-center lg:justify-between print:hidden">
        <div className="focus-ring flex w-full items-center gap-3 rounded-xl bg-white/5 px-4 py-3 ring-1 ring-white/10 transition-all focus-within:ring-[var(--cs-accent)] lg:w-[460px]">
          <Search size={18} className="text-white/40" />
          <input
            aria-label="Savdo, mijoz yoki skin bo'yicha qidirish"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Mijoz ismi, skin nomi yoki ID..."
            className="bg-transparent border-none outline-none text-[15px] text-white placeholder:text-white/30 w-full"
          />
        </div>
        
        <div className="flex flex-wrap items-center gap-3 text-xs font-mono text-white/40">
          <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-2">
            <Clock3 size={14} /> Asia/Tashkent
          </span>
          <strong className="rounded-full border border-white/10 bg-white/5 px-3 py-2 text-white/70">{generatedAtLabel}</strong>
        </div>

        <div className="flex flex-wrap gap-2">
          {hasFilters && (
            <button className="focus-ring flex items-center gap-2 rounded-xl bg-white/5 px-4 py-2 text-xs text-white/60 transition-colors hover:bg-white/10 hover:text-white active:scale-[0.98]" type="button" onClick={clearFilters}>
              <RotateCcw size={14} /> Tozalash
            </button>
          )}
          <button 
            onClick={handlePrint}
            className="focus-ring flex items-center gap-2 rounded-xl bg-white/10 px-4 py-2 text-xs font-medium text-white transition-colors hover:bg-white/15 active:scale-[0.98]"
            type="button"
          >
            <Printer size={14} /> PDF Hisobot
          </button>
          <a className="focus-ring flex items-center gap-2 rounded-xl bg-white/5 px-4 py-2 text-xs font-medium text-white/70 transition-colors hover:bg-white/10 active:scale-[0.98]" href="/api/export">
            <Download size={14} /> CSV
          </a>
        </div>
      </section>

      {/* Main Header */}
      <header className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
        <div className="flex flex-col gap-3">
          <div className="inline-flex items-center rounded-full px-3 py-1 text-[10px] uppercase tracking-[0.2em] font-medium bg-white/5 border border-white/10 text-white/60 w-max print:hidden">
            OneStore Operations
          </div>
          <h1 className="text-4xl md:text-5xl font-semibold tracking-tighter text-white">Boshqaruv paneli</h1>
          <p className="max-w-[62ch] text-sm leading-6 text-white/50 print:hidden">
            Tizimdagi umumiy tushum, sof foyda va faol tranzaksiyalarning real vaqt rejimidagi ko‘rinishi.
          </p>
        </div>
      </header>

      {/* Primary Metrics Row (Simplified to 4 clean stats cards) */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 print:grid-cols-4 print:gap-2">
        <div className="flex flex-col gap-2 p-6 rounded-2xl bg-white/[0.02] border border-white/5 print:bg-transparent print:border-zinc-200 print:text-black">
          <span className="text-[11px] uppercase tracking-widest text-white/40 font-mono print:text-zinc-500">Tushum (Revenue)</span>
          <strong className="text-3xl text-white font-medium tracking-tight font-mono print:text-black">{formatUsd(totals.revenue)}</strong>
          <span className="text-xs text-white/30 font-mono print:text-zinc-400">Yakunlangan savdo hajmi</span>
        </div>
        <div className="flex flex-col gap-2 p-6 rounded-2xl bg-white/[0.02] border border-white/5 print:bg-transparent print:border-zinc-200 print:text-black">
          <span className="text-[11px] uppercase tracking-widest text-white/40 font-mono print:text-zinc-500">Sof Foyda (Net Profit)</span>
          <strong className="text-3xl text-[var(--cs-success)] font-medium tracking-tight font-mono print:text-emerald-700">{formatUsd(totals.margin)}</strong>
          <span className="text-xs text-white/30 font-mono print:text-zinc-400">
            {totals.revenue > 0 ? `Tushumning ${Math.round((totals.margin / totals.revenue) * 100)}% qismi` : "Savdo yo‘q"}
          </span>
        </div>
        <div className="flex flex-col gap-2 p-6 rounded-2xl bg-white/[0.02] border border-white/5 print:bg-transparent print:border-zinc-200 print:text-black">
          <span className="text-[11px] uppercase tracking-widest text-white/40 font-mono print:text-zinc-500">Mijozlar</span>
          <strong className="text-3xl text-white font-medium tracking-tight font-mono print:text-black">{clients.length}</strong>
          <span className="text-xs text-white/30 font-mono print:text-zinc-400">Jami ro‘yxatdan o‘tganlar</span>
        </div>
        <div className="flex flex-col gap-2 p-6 rounded-2xl bg-white/[0.02] border border-white/5 print:bg-transparent print:border-zinc-200 print:text-black">
          <span className="text-[11px] uppercase tracking-widest text-white/40 font-mono print:text-zinc-500">Kutilmoqda / Escrow</span>
          <strong className="text-3xl text-[var(--cs-warning)] font-medium tracking-tight font-mono print:text-amber-700">{totals.escrow} ta</strong>
          <span className="text-xs text-white/30 font-mono print:text-zinc-400">Faol nazoratdagi savdolar</span>
        </div>
      </section>

      {/* Simplified Full-Width Transactions Table */}
      <div className="doppelrand flex flex-col min-h-[500px] print:border-none print:shadow-none print:bg-transparent">
        <div className="doppelrand-inner flex flex-col overflow-hidden h-full print:bg-transparent print:shadow-none">
          
          {/* Table Toolbar */}
          <div className="p-6 border-b border-white/5 flex flex-col gap-4 print:hidden">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-medium text-white">Oxirgi savdolar</h2>
              <span className="text-xs font-mono text-white/40 bg-white/5 px-2.5 py-1 rounded">{filteredTrades.length} ta savdo</span>
            </div>
            
            <div className="flex flex-wrap gap-3">
              <Tabs value={statusFilter} onValueChange={setStatusFilter} className="w-full sm:w-auto">
                <TabsList className="bg-white/5 ring-1 ring-white/10 h-9 p-1">
                  {statusOptions.map((status) => (
                    <TabsTrigger 
                      key={status.value} 
                      value={status.value}
                      className="text-xs data-[state=active]:bg-white/10 data-[state=active]:text-white text-white/45 h-7 rounded-sm"
                    >
                      {status.label}
                      <span className="ml-2 font-mono text-[10px] text-white/35">{status.count}</span>
                    </TabsTrigger>
                  ))}
                </TabsList>
              </Tabs>
              
              <div className="flex items-center gap-2 rounded-lg bg-white/5 px-3 h-9 text-xs text-white/45 ring-1 ring-white/10">
                <Filter size={14} />
                <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                  <SelectTrigger className="w-[150px] border-none bg-transparent focus:ring-0 focus:ring-offset-0 text-xs text-white/80 p-0 h-auto shadow-none">
                    <SelectValue placeholder="Ustuvorlik" />
                  </SelectTrigger>
                  <SelectContent className="bg-[var(--cs-panel-raised)] border-white/10 text-white/80">
                    {priorityOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value} className="focus:bg-white/10 focus:text-white cursor-pointer">
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center gap-2 rounded-lg bg-white/5 px-3 h-9 text-xs text-white/45 ring-1 ring-white/10">
                <ArrowDownUp size={14} />
                <Select value={sortMode} onValueChange={setSortMode}>
                  <SelectTrigger className="w-[110px] border-none bg-transparent focus:ring-0 focus:ring-offset-0 text-xs text-white/80 p-0 h-auto shadow-none">
                    <SelectValue placeholder="Saralash" />
                  </SelectTrigger>
                  <SelectContent className="bg-[var(--cs-panel-raised)] border-white/10 text-white/80">
                    <SelectItem value="newest" className="focus:bg-white/10 focus:text-white cursor-pointer">Yangi</SelectItem>
                    <SelectItem value="amount" className="focus:bg-white/10 focus:text-white cursor-pointer">Katta summa</SelectItem>
                    <SelectItem value="margin" className="focus:bg-white/10 focus:text-white cursor-pointer">Katta foyda</SelectItem>
                    <SelectItem value="oldest" className="focus:bg-white/10 focus:text-white cursor-pointer">Eski</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          
          {/* Table Element */}
          <div className="flex-1 overflow-auto">
            <table className="w-full min-w-[800px] border-collapse text-left print:min-w-full">
              <thead className="sticky top-0 z-10 bg-[var(--cs-panel-solid)]/95 backdrop-blur-md print:bg-transparent print:text-black">
                <tr className="border-b border-white/5 print:border-zinc-300">
                  <th className="py-3 px-6 text-[11px] uppercase tracking-widest text-white/35 font-mono print:text-zinc-500">ID</th>
                  <th className="py-3 px-6 text-[11px] uppercase tracking-widest text-white/35 font-mono print:text-zinc-500">Mijoz</th>
                  <th className="py-3 px-6 text-[11px] uppercase tracking-widest text-white/35 font-mono print:text-zinc-500">Skin nomi</th>
                  <th className="py-3 px-6 text-[11px] uppercase tracking-widest text-white/35 font-mono print:text-zinc-500">Sotilgan narxi</th>
                  <th className="py-3 px-6 text-[11px] uppercase tracking-widest text-white/35 font-mono print:text-zinc-500">Sof foyda</th>
                  <th className="py-3 px-6 text-[11px] uppercase tracking-widest text-white/35 font-mono print:text-zinc-500">Holat</th>
                  <th className="py-3 px-6 text-[11px] uppercase tracking-widest text-white/35 font-mono print:text-zinc-500 print:hidden">Sana</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 print:divide-zinc-200 print:text-black">
                {filteredTrades.map((trade) => (
                  <tr
                    key={trade.id}
                    onClick={() => router.push(`/clients/${trade.clientId}`)}
                    className="group cursor-pointer transition-colors hover:bg-white/[0.02] print:hover:bg-transparent"
                  >
                    <td className="py-4 px-6 text-sm font-mono text-white/45 print:text-zinc-500">
                      {trade.tradeId ?? trade.id.slice(0, 8)}
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex flex-col">
                        <span className="text-[15px] font-medium text-white/90 group-hover:text-red-400 transition-colors print:text-black print:font-semibold">
                          {trade.client.name}
                        </span>
                        <span className="text-xs text-white/40 font-mono print:text-zinc-500">
                          {trade.client.telegram || trade.client.phone || "Aloqa yo'q"}
                        </span>
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-3">
                        <div className={cn("w-1.5 h-1.5 rounded-full shrink-0 print:hidden", rarityColor(trade.rarity))} />
                        <div className="flex flex-col">
                          <span className="text-[15px] text-white/80 print:text-black">{trade.item}</span>
                          <span className="text-xs text-white/40 print:text-zinc-500">{trade.rarity}</span>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-6 font-mono text-[15px] text-white print:text-black">
                      {formatUsd(trade.price)}
                    </td>
                    <td className="py-4 px-6 font-mono text-[15px] text-[var(--cs-success)] print:text-emerald-700 font-medium">
                      +{formatUsd(trade.marginUsd)}
                    </td>
                    <td className="py-4 px-6">
                      <span className={cn(
                        "text-[10px] uppercase tracking-widest font-mono px-2.5 py-0.5 rounded-full border print:bg-transparent print:border-none print:p-0 print:text-[11px]",
                        statusClass(trade.status)
                      )}>
                        {statusLabels[trade.status]}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-xs text-white/40 font-mono print:hidden">
                      {formatShortDate(trade.date)}
                    </td>
                  </tr>
                ))}
                {filteredTrades.length === 0 && (
                  <tr>
                    <td colSpan={7} className="py-20 text-center">
                      <div className="mx-auto flex max-w-sm flex-col items-center gap-3 text-sm text-white/45">
                        <div className="flex size-11 items-center justify-center rounded-full border border-white/10 bg-white/5 text-white/50">
                          <AlertCircle size={18} />
                        </div>
                        <strong className="text-base font-medium text-white">Savdo topilmadi</strong>
                        <span>Filterlarni tozalab ko‘ring.</span>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

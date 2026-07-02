"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  AlertCircle,
  ArrowDownUp,
  BarChart3,
  Clock3,
  Download,
  Filter,
  LineChart as LineChartIcon,
  Printer,
  RotateCcw,
  Search,
  Target,
  TrendingUp,
} from "lucide-react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
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
  };
};

type Client = {
  id: string;
  name: string;
  phone: string | null;
  telegram: string | null;
  steamId: string | null;
  externalId: string | null;
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

function compactUsd(value: number) {
  return new Intl.NumberFormat("en-US", {
    notation: "compact",
    maximumFractionDigits: 1,
    style: "currency",
    currency: "USD",
  }).format(value);
}

function chartDateKey(value: string) {
  const date = new Date(value);
  return date.toISOString().slice(0, 10);
}

function chartDateLabel(value: string) {
  const date = new Date(`${value}T00:00:00.000Z`);
  const months = ["yan", "fev", "mar", "apr", "may", "iyn", "iyl", "avg", "sen", "okt", "noy", "dek"];
  return `${String(date.getUTCDate()).padStart(2, "0")} ${months[date.getUTCMonth()]}`;
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
          (priorityFilter === "REVIEW" && ["DISPUTED"].includes(trade.status));
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

  const completedTrades = useMemo(() => trades.filter((trade) => trade.status === "COMPLETED"), [trades]);

  const trendData = useMemo(() => {
    const buckets = new Map<string, { date: string; label: string; revenue: number; margin: number; trades: number }>();

    completedTrades.forEach((trade) => {
      const key = chartDateKey(trade.date);
      const current = buckets.get(key) ?? {
        date: key,
        label: chartDateLabel(key),
        revenue: 0,
        margin: 0,
        trades: 0,
      };

      current.revenue += trade.price;
      current.margin += trade.marginUsd;
      current.trades += 1;
      buckets.set(key, current);
    });

    return Array.from(buckets.values())
      .sort((a, b) => a.date.localeCompare(b.date))
      .slice(-14);
  }, [completedTrades]);

  const statusMix = useMemo(() => {
    const groups = [
      { key: "COMPLETED", label: "Yakunlangan", value: totals.completed, color: "hsl(158 58% 44%)" },
      { key: "DISPUTED", label: "Nizoli", value: totals.disputed, color: "hsl(350 78% 58%)" },
    ];

    return groups.filter((group) => group.value > 0);
  }, [totals.completed, totals.disputed]);

  const topClients = useMemo(
    () =>
      clients
        .map((client) => ({
          id: client.id,
          name: client.name,
          totalSpent: client.totalSpent,
          tradeCount: client.transactions.filter((transaction) => transaction.status === "COMPLETED").length,
        }))
        .sort((a, b) => b.totalSpent - a.totalSpent)
        .slice(0, 5),
    [clients],
  );

  const maxClientSpend = Math.max(...topClients.map((client) => client.totalSpent), 1);
  const marginRate = totals.revenue > 0 ? Math.round((totals.margin / totals.revenue) * 100) : 0;
  const highValueTrades = trades.filter((trade) => trade.price >= 1000).length;
  const averageMargin = totals.completed > 0 ? totals.margin / totals.completed : 0;

  const statusOptions = [
    { value: "ALL", label: "Barchasi", count: trades.length },
    { value: "COMPLETED", label: statusLabels.COMPLETED, count: totals.completed },
    { value: "DISPUTED", label: statusLabels.DISPUTED, count: totals.disputed },
  ];

  const priorityOptions = [
    { value: "ALL", label: "Barchasi", count: trades.length },
    { value: "HIGH_VALUE", label: "Katta savdolar ($1k+)", count: trades.filter((trade) => trade.price >= 1000).length },
    { value: "REVIEW", label: "Tekshiruvdagilar", count: trades.filter((trade) => ["DISPUTED"].includes(trade.status)).length },
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

      {/* Print-only Report Header */}
      <div className="hidden print:flex flex-col gap-6 w-full text-black mb-8 border-b pb-6 border-zinc-200">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-zinc-900">ONESTORE OPERATIONS REPORT</h1>
            <p className="text-xs text-zinc-500 font-mono mt-1">Biznes jarayonlari va savdolar tahlili (Dashboard)</p>
          </div>
          <div className="text-right">
            <h2 className="text-xl font-bold uppercase tracking-wider text-zinc-700 font-semibold">Moliya Hisoboti</h2>
            <p className="text-xs text-zinc-500 mt-1">Chop etilgan sana: {new Date().toLocaleDateString('uz-Latn-UZ')} ({generatedAtLabel})</p>
          </div>
        </div>
      </div>

      {/* Main Header */}
      <header className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between print:hidden">
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

      {/* Primary Metrics Row (Simplified to 3 clean stats cards) */}
      <section className="grid grid-cols-1 sm:grid-cols-3 gap-4 print:grid-cols-3 print:gap-2">
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
      </section>

      <section className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1.55fr)_minmax(320px,0.9fr)] print:hidden">
        <div className="doppelrand min-h-[360px]">
          <div className="doppelrand-inner flex h-full flex-col gap-5 p-6">
            <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
              <div>
                <div className="flex items-center gap-2 text-[11px] font-mono uppercase tracking-widest text-white/35">
                  <LineChartIcon size={14} className="text-[var(--cs-success)]" />
                  14 kunlik impuls
                </div>
                <h2 className="mt-2 text-xl font-medium tracking-tight text-white">Tushum va sof foyda ritmi</h2>
              </div>
              <div className="grid grid-cols-2 gap-3 text-right">
                <div className="rounded-xl border border-white/10 bg-white/[0.025] px-3 py-2">
                  <span className="block text-[10px] uppercase tracking-widest text-white/35">Margin</span>
                  <strong className="font-mono text-lg text-[var(--cs-success)]">{marginRate}%</strong>
                </div>
                <div className="rounded-xl border border-white/10 bg-white/[0.025] px-3 py-2">
                  <span className="block text-[10px] uppercase tracking-widest text-white/35">Avg profit</span>
                  <strong className="font-mono text-lg text-white">{formatUsd(averageMargin)}</strong>
                </div>
              </div>
            </div>

            <div className="h-[240px] min-h-[240px]">
              {trendData.length > 0 ? (
                <ResponsiveContainer height="100%" width="100%">
                  <AreaChart data={trendData} margin={{ bottom: 0, left: -18, right: 10, top: 12 }}>
                    <defs>
                      <linearGradient id="revenueGradient" x1="0" x2="0" y1="0" y2="1">
                        <stop offset="0%" stopColor="hsl(0 83% 62%)" stopOpacity={0.34} />
                        <stop offset="100%" stopColor="hsl(0 83% 62%)" stopOpacity={0.02} />
                      </linearGradient>
                      <linearGradient id="marginGradient" x1="0" x2="0" y1="0" y2="1">
                        <stop offset="0%" stopColor="hsl(158 58% 44%)" stopOpacity={0.28} />
                        <stop offset="100%" stopColor="hsl(158 58% 44%)" stopOpacity={0.02} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid stroke="rgba(255,255,255,0.06)" vertical={false} />
                    <XAxis
                      axisLine={false}
                      dataKey="label"
                      minTickGap={18}
                      tick={{ fill: "rgba(255,255,255,0.35)", fontSize: 11 }}
                      tickLine={false}
                    />
                    <YAxis
                      axisLine={false}
                      tick={{ fill: "rgba(255,255,255,0.35)", fontSize: 11 }}
                      tickFormatter={compactUsd}
                      tickLine={false}
                    />
                    <Tooltip
                      contentStyle={{
                        background: "hsl(0 0% 6%)",
                        border: "1px solid rgba(255,255,255,0.12)",
                        borderRadius: 12,
                        color: "white",
                      }}
                      formatter={(value, name) => [formatUsd(Number(value ?? 0)), name === "revenue" ? "Tushum" : "Sof foyda"]}
                      labelStyle={{ color: "rgba(255,255,255,0.55)" }}
                    />
                    <Area dataKey="revenue" fill="url(#revenueGradient)" name="revenue" stroke="hsl(0 83% 62%)" strokeWidth={2} type="monotone" />
                    <Area dataKey="margin" fill="url(#marginGradient)" name="margin" stroke="hsl(158 58% 44%)" strokeWidth={2} type="monotone" />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex h-full items-center justify-center rounded-2xl border border-dashed border-white/10 text-sm text-white/40">
                  Grafik uchun yakunlangan savdolar hali yo&apos;q.
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 xl:grid-cols-1">
          <div className="doppelrand">
            <div className="doppelrand-inner p-5">
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2 text-[11px] font-mono uppercase tracking-widest text-white/35">
                    <BarChart3 size={14} className="text-[var(--cs-warning)]" />
                    Holat miksi
                  </div>
                  <h3 className="mt-2 text-base font-medium text-white">Savdo holatlari</h3>
                </div>
                <span className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1 font-mono text-xs text-white/45">{trades.length} total</span>
              </div>
              <div className="mt-4 h-[150px]">
                {statusMix.length > 0 ? (
                  <ResponsiveContainer height="100%" width="100%">
                    <BarChart data={statusMix} layout="vertical" margin={{ bottom: 0, left: 8, right: 24, top: 0 }}>
                      <XAxis axisLine={false} hide type="number" />
                      <YAxis axisLine={false} dataKey="label" tick={{ fill: "rgba(255,255,255,0.44)", fontSize: 11 }} tickLine={false} type="category" width={88} />
                      <Tooltip
                        contentStyle={{
                          background: "hsl(0 0% 6%)",
                          border: "1px solid rgba(255,255,255,0.12)",
                          borderRadius: 12,
                          color: "white",
                        }}
                        cursor={{ fill: "rgba(255,255,255,0.035)" }}
                      />
                      <Bar dataKey="value" radius={[0, 8, 8, 0]}>
                        {statusMix.map((entry) => (
                          <Cell fill={entry.color} key={entry.key} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex h-full items-center justify-center rounded-xl border border-dashed border-white/10 text-xs text-white/40">Status ma&apos;lumoti yo&apos;q</div>
                )}
              </div>
            </div>
          </div>

          <div className="doppelrand">
            <div className="doppelrand-inner p-5">
              <div className="flex items-center gap-2 text-[11px] font-mono uppercase tracking-widest text-white/35">
                <Target size={14} className="text-red-300" />
                Top mijozlar
              </div>
              <div className="mt-4 flex flex-col gap-3">
                {topClients.map((client, index) => (
                  <button
                    className="group grid grid-cols-[24px_1fr_auto] items-center gap-3 rounded-xl border border-white/5 bg-white/[0.018] p-3 text-left transition-colors hover:bg-white/[0.04]"
                    key={client.id}
                    onClick={() => router.push(`/clients/${client.id}`)}
                    type="button"
                  >
                    <span className="font-mono text-xs text-white/35">{String(index + 1).padStart(2, "0")}</span>
                    <span className="min-w-0">
                      <span className="block truncate text-sm font-medium text-white/85 group-hover:text-white">{client.name}</span>
                      <span className="mt-2 block h-1.5 overflow-hidden rounded-full bg-white/5">
                        <span className="block h-full rounded-full bg-[var(--cs-success)]" style={{ width: `${Math.max(8, (client.totalSpent / maxClientSpend) * 100)}%` }} />
                      </span>
                    </span>
                    <span className="text-right font-mono text-sm text-white">{formatUsd(client.totalSpent)}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="grid grid-cols-1 gap-4 lg:grid-cols-3 print:hidden">
        <div className="rounded-2xl border border-white/5 bg-white/[0.018] p-5">
          <div className="flex items-center gap-2 text-[11px] font-mono uppercase tracking-widest text-white/35">
            <TrendingUp size={14} className="text-[var(--cs-success)]" />
            High value
          </div>
          <strong className="mt-3 block font-mono text-3xl text-white">{highValueTrades}</strong>
          <p className="mt-1 text-xs text-white/40">$1k dan yuqori savdolar soni</p>
        </div>
        <div className="rounded-2xl border border-white/5 bg-white/[0.018] p-5">
          <div className="flex items-center gap-2 text-[11px] font-mono uppercase tracking-widest text-white/35">
            <Target size={14} className="text-red-300" />
            Conversion signal
          </div>
          <strong className="mt-3 block font-mono text-3xl text-white">{clients.length > 0 ? Math.round((totals.completed / clients.length) * 10) / 10 : 0}</strong>
          <p className="mt-1 text-xs text-white/40">Har bir mijozga o&apos;rtacha yakunlangan savdo</p>
        </div>
        <div className="rounded-2xl border border-white/5 bg-white/[0.018] p-5">
          <div className="flex items-center gap-2 text-[11px] font-mono uppercase tracking-widest text-white/35">
            <Clock3 size={14} className="text-[var(--cs-danger)]" />
            Nizoli navbat
          </div>
          <strong className="mt-3 block font-mono text-3xl text-[var(--cs-danger)]">{totals.disputed}</strong>
          <p className="mt-1 text-xs text-white/40">Faol nizoli tranzaksiyalar soni</p>
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

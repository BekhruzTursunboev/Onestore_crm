"use client";

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, ArrowUpRight, Loader2, Plus, Printer, Trash2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

type Transaction = {
  id: string;
  item: string;
  price: number;
  marginUsd: number;
  status: string;
  rarity: string;
  date: string;
  paymentMethod: string;
  channel: string;
  tradeId: string | null;
  floatValue: number | null;
};

type ClientData = {
  id: string;
  name: string;
  phone: string | null;
  telegram: string | null;
  totalSpent: number;
  createdAt: string;
  transactions: Transaction[];
};

const statusLabels: Record<string, string> = {
  COMPLETED: "Yakunlangan",
  ESCROW: "Escrowda",
  PENDING: "Kutilmoqda",
  DISPUTED: "Nizoli",
  CANCELLED: "Bekor qilingan",
};

async function fetchClient(clientId: string) {
  const res = await fetch(`/api/clients/${clientId}`);
  if (!res.ok) throw new Error('Mijoz yuklanmadi');
  return res.json() as Promise<ClientData>;
}

export default function ClientDetailView({
  clientId,
  initialClient,
}: {
  clientId: string;
  initialClient: ClientData;
}) {
  const [client, setClient] = useState(initialClient);
  const router = useRouter();

  // Transaction Modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [submitError, setSubmitError] = useState("");

  async function handleAddTransaction(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const formData = new FormData(form);
    const payload = Object.fromEntries(formData);
    
    setSubmitLoading(true);
    setSubmitError("");

    try {
      const res = await fetch("/api/transactions", {
        method: "POST",
        body: JSON.stringify({
          ...payload,
          clientId,
        }),
        headers: { "Content-Type": "application/json" },
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Savdo saqlanmadi");
      }

      form.reset();
      setModalOpen(false);
      setClient(await fetchClient(clientId));
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : "Xatolik yuz berdi");
    } finally {
      setSubmitLoading(false);
    }
  }

  async function handleDeleteClient() {
    if (typeof window !== "undefined" && !window.confirm("Haqiqatan ham ushbu mijozni butunlay o‘chirishni xohlaysizmi? Uning barcha tranzaksiyalari ham o‘chiriladi. Bu amalni ortga qaytarib bo‘lmaydi.")) {
      return;
    }

    try {
      const res = await fetch(`/api/clients/${clientId}`, {
        method: "DELETE",
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Mijozni o‘chirib bo‘lmadi");
      }

      router.push("/clients");
    } catch (err) {
      alert(err instanceof Error ? err.message : "Xatolik yuz berdi");
    }
  }

  async function handleDeleteTransaction(txId: string) {
    if (typeof window !== "undefined" && !window.confirm("Haqiqatan ham ushbu savdoni o‘chirishni xohlaysizmi? Bu amalni ortga qaytarib bo‘lmaydi.")) {
      return;
    }

    try {
      const res = await fetch("/api/transactions", {
        method: "DELETE",
        body: JSON.stringify({ id: txId }),
        headers: { "Content-Type": "application/json" },
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Savdo o‘chirilmadi");
      }

      setClient(await fetchClient(clientId));
    } catch (err) {
      alert(err instanceof Error ? err.message : "Xatolik yuz berdi");
    }
  }

  function handlePrint() {
    if (typeof window !== "undefined") {
      window.print();
    }
  }

  const formatCurrency = (amount: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
  const formatDate = (dateStr: string) => new Intl.DateTimeFormat('uz-Latn-UZ', { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'Asia/Tashkent' }).format(new Date(dateStr));

  return (
    <div className="w-full flex flex-col gap-12 animate-in fade-in slide-in-from-bottom-8 duration-700 print:p-0">
      
      {/* Back to clients & Print Actions */}
      <div className="flex items-center justify-between print:hidden">
        <Link href="/clients" className="inline-flex items-center gap-2 text-sm text-white/40 hover:text-white transition-colors group">
          <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" /> Mijozlar bazasi
        </Link>
        <div className="flex gap-2">
          <button 
            onClick={handleDeleteClient}
            className="focus-ring flex items-center gap-2 rounded-xl bg-red-950/20 border border-red-500/20 px-4 py-2 text-xs font-medium text-red-400 hover:bg-red-500/10 hover:text-red-300 transition-colors active:scale-95 animate-in fade-in"
            type="button"
          >
            <Trash2 size={14} /> Mijozni o‘chirish
          </button>
          <button 
            onClick={handlePrint}
            className="focus-ring flex items-center gap-2 rounded-xl bg-white/5 border border-white/10 px-4 py-2 text-xs font-medium text-white/70 hover:bg-white/10 hover:text-white transition-colors active:scale-95"
            type="button"
          >
            <Printer size={14} /> PDF Invoys
          </button>

          {/* Add Transaction Dialog */}
          <Dialog open={modalOpen} onOpenChange={setModalOpen}>
            <DialogTrigger asChild>
              <Button variant="island" className="h-9 px-4 text-xs font-semibold gap-2 rounded-xl">
                <Plus size={14} /> Yangi savdo qo‘shish
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-[500px] border-white/10 bg-[#090909] p-0 shadow-2xl doppelrand-inner overflow-hidden">
              <DialogHeader className="border-b border-white/10 p-6">
                <DialogTitle className="text-xl font-semibold tracking-tight text-white">Yangi savdo qo‘shish</DialogTitle>
                <DialogDescription className="text-sm text-white/50">
                  Mijoz {client.name} uchun yangi skin xaridini ro‘yxatga olish.
                </DialogDescription>
              </DialogHeader>

              <form className="flex flex-col p-6 gap-4 overflow-y-auto max-h-[60vh] custom-scrollbar" onSubmit={handleAddTransaction}>
                <label>
                  <span className="crm-label">Skin nomi</span>
                  <input className="crm-input" name="item" placeholder="AWP | Asiimov" required />
                </label>

                <div className="grid grid-cols-2 gap-4">
                  <label>
                    <span className="crm-label">Sotib olingan narx (Tannarxi), USD</span>
                    <input className="crm-input" min="0" step="0.01" type="number" name="buyPrice" placeholder="60" required />
                  </label>
                  <label>
                    <span className="crm-label">Sotilgan narx (Summasi), USD</span>
                    <input className="crm-input" min="0" step="0.01" type="number" name="price" placeholder="85" required />
                  </label>
                </div>

                <label>
                  <span className="crm-label">Holat (Status)</span>
                  <select className="crm-select" defaultValue="COMPLETED" name="status">
                    <option value="COMPLETED">Yakunlangan</option>
                    <option value="DISPUTED">Nizoli</option>
                    <option value="CANCELLED">Bekor qilingan</option>
                  </select>
                </label>

                <div className="grid grid-cols-2 gap-4">
                  <label>
                    <span className="crm-label">Float qiymati</span>
                    <input className="crm-input" type="number" step="0.000000001" name="floatValue" placeholder="0.154" />
                  </label>
                  <label>
                    <span className="crm-label">Trade ID</span>
                    <input className="crm-input" name="tradeId" placeholder="123456789" />
                  </label>
                </div>

                {submitError && (
                  <div className="text-xs text-red-400 bg-red-950/20 border border-red-500/20 p-3 rounded-xl mt-2">
                    {submitError}
                  </div>
                )}

                <div className="flex gap-3 mt-4 border-t border-white/10 pt-4">
                  <Button
                    className="flex-1 bg-white text-black hover:bg-white/90 h-11 text-xs font-semibold rounded-xl"
                    disabled={submitLoading}
                    type="submit"
                  >
                    {submitLoading ? <Loader2 className="animate-spin mr-2" size={14} /> : null}
                    Saqlash
                  </Button>
                  <Button
                    variant="outline"
                    className="border-white/10 bg-transparent text-white/70 hover:bg-white/[0.06] hover:text-white h-11 text-xs px-5 rounded-xl"
                    disabled={submitLoading}
                    onClick={() => setModalOpen(false)}
                    type="button"
                  >
                    Bekor qilish
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Main Info Blocks */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 print:hidden">
        
        {/* Profile Card */}
        <div className="lg:col-span-2 doppelrand print:border-none print:shadow-none print:bg-transparent">
          <div className="doppelrand-inner p-8 flex flex-col justify-between print:bg-transparent print:p-0">
            <div className="mb-12 print:mb-6">
              <div className="inline-flex items-center rounded-full px-3 py-1 text-[10px] uppercase tracking-[0.2em] font-medium bg-white/5 border border-white/10 text-white/60 mb-6 print:hidden">
                Mijoz Ma‘lumotnomasi
              </div>
              <h1 className="text-5xl font-semibold tracking-tighter text-white print:text-black print:text-4xl">{client.name}</h1>
            </div>
            
            <div className="flex gap-12 print:gap-8">
              <div className="flex flex-col gap-1">
                <span className="text-[10px] text-white/30 uppercase tracking-widest font-mono print:text-zinc-500">Telefon</span>
                <span className="text-sm text-white/70 print:text-black">{client.phone || 'Kiritilmagan'}</span>
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-[10px] text-white/30 uppercase tracking-widest font-mono print:text-zinc-500">Telegram</span>
                <span className="text-sm text-white/70 print:text-black">{client.telegram || 'Kiritilmagan'}</span>
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-[10px] text-white/30 uppercase tracking-widest font-mono print:text-zinc-500">Qo‘shilgan sana</span>
                <span className="text-sm text-white/70 print:text-black">{formatDate(client.createdAt)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Total Spent Card */}
        <div className="doppelrand print:border-none print:shadow-none print:bg-transparent">
          <div className="doppelrand-inner p-8 flex flex-col justify-between relative overflow-hidden print:bg-transparent print:p-0">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 blur-3xl rounded-full print:hidden" />
            <span className="text-[10px] text-white/30 uppercase tracking-widest font-mono print:text-zinc-500">Jami xarid hajmi</span>
            <div className="mt-8 print:mt-2">
              <span className="text-4xl lg:text-5xl font-medium tracking-tight text-white font-mono print:text-black print:text-3xl">
                {formatCurrency(client.totalSpent)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Transaction History Section */}
      <div className="flex flex-col gap-6 print:hidden">
        <h2 className="text-lg font-medium text-white/80 print:text-black print:text-base print:border-b print:pb-2 print:border-zinc-300">Xaridlar tarixi</h2>
        
        {client.transactions.length === 0 ? (
          <div className="py-12 border border-white/5 border-dashed rounded-2xl text-center text-white/30 text-sm print:text-black">
            Mijoz hali savdo amalga oshirmagan.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 print:grid-cols-1 print:gap-2">
            {client.transactions.map((tx, i) => {
              const netProfit = tx.marginUsd;
              return (
                <div key={tx.id} className="doppelrand !p-[1px] group print:border-none print:shadow-none print:bg-transparent" style={{ animationDelay: `${i * 100}ms` }}>
                  <div className="doppelrand-inner p-5 flex items-center justify-between group-hover:bg-white/[0.03] transition-colors duration-500 print:bg-transparent print:p-2 print:border-b print:border-zinc-200">
                    <div className="flex flex-col gap-2">
                      <span className="text-base text-white/90 font-medium print:text-black print:font-semibold">{tx.item}</span>
                      <div className="flex items-center gap-3">
                        <span className="text-xs text-white/40 print:text-zinc-500">{formatDate(tx.date)}</span>
                        <span className={`text-[10px] uppercase tracking-widest font-mono px-2 py-0.5 rounded-full border ${
                          tx.status === 'COMPLETED' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 print:text-emerald-700' : 'bg-amber-500/10 text-amber-400 border border-amber-500/20 print:text-amber-700'
                        } print:border-none print:p-0 print:text-[11px]`}>
                          {statusLabels[tx.status] ?? tx.status}
                        </span>
                        {tx.tradeId && <span className="text-[10px] text-white/30 font-mono print:hidden">ID: {tx.tradeId}</span>}
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="flex flex-col items-end">
                        <span className="font-mono text-white/90 font-semibold print:text-black">{formatCurrency(tx.price)}</span>
                        <span className="font-mono text-xs text-[var(--cs-success)] print:text-emerald-700 font-medium">+{formatCurrency(netProfit)} foyda</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteTransaction(tx.id);
                          }}
                          className="w-8 h-8 rounded-full border border-red-500/10 bg-red-500/5 hover:bg-red-500/20 text-red-400 flex items-center justify-center transition-colors print:hidden active:scale-95"
                          title="Savdoni o'chirish"
                        >
                          <Trash2 size={13} />
                        </button>
                        <div className="w-8 h-8 rounded-full border border-white/5 flex items-center justify-center group-hover:bg-white/10 transition-colors print:hidden">
                          <ArrowUpRight size={14} className="text-white/40 group-hover:text-white transition-colors" />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* -------------------- PRINT-ONLY INVOICE REPORT -------------------- */}
      <div className="hidden print:flex flex-col gap-8 w-full text-black bg-white p-4">
        {/* Corporate header */}
        <div className="flex justify-between items-start border-b pb-6 border-zinc-200">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-zinc-900">ONESTORE</h1>
            <p className="text-xs text-zinc-500 font-mono mt-1">Savdo Invoysi / Invoice</p>
          </div>
          <div className="text-right">
            <h2 className="text-xl font-bold uppercase tracking-wider text-zinc-700">INVOYS</h2>
            <p className="text-xs text-zinc-500 mt-1">Sana: {new Date().toLocaleDateString('uz-Latn-UZ')}</p>
          </div>
        </div>

        {/* Sender vs Customer Details */}
        <div className="grid grid-cols-2 gap-8 text-xs">
          <div>
            <h3 className="font-semibold text-zinc-500 uppercase tracking-wider mb-2">Yuboruvchi (Seller):</h3>
            <p className="font-bold text-zinc-800 text-[13px]">OneStore CRM</p>
            <p className="text-zinc-500 mt-1 font-mono">Telegram: @onestore_admin</p>
            <p className="text-zinc-500 font-mono">Veb-sayt: www.onestore.uz</p>
          </div>
          <div>
            <h3 className="font-semibold text-zinc-500 uppercase tracking-wider mb-2">Mijoz (Client):</h3>
            <p className="font-bold text-zinc-800 text-[13px]">{client.name}</p>
            {client.phone && <p className="text-zinc-500 mt-1 font-mono">Telefon: {client.phone}</p>}
            {client.telegram && <p className="text-zinc-500 font-mono">Telegram: {client.telegram}</p>}
            <p className="text-zinc-500 font-mono">Ro‘yxatdan o‘tgan: {formatDate(client.createdAt)}</p>
          </div>
        </div>

        {/* Itemized Table */}
        <div className="mt-4">
          <h3 className="text-xs font-semibold text-zinc-600 uppercase tracking-wider mb-3">Xarid Qilingan Buyumlar</h3>
          <table className="w-full border-collapse text-xs text-left">
            <thead>
              <tr className="border-b border-zinc-300 text-zinc-500 font-mono">
                <th className="py-2.5 pr-4 text-left w-10">T/R</th>
                <th className="py-2.5 pr-4">BUYUM (SKIN)</th>
                <th className="py-2.5 pr-4">SANA</th>
                <th className="py-2.5 pr-4">TRADE ID (TRANZAKSIYA)</th>
                <th className="py-2.5 pr-4 text-center">HOLATI</th>
                <th className="py-2.5 text-right">NARXI</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200 text-zinc-800">
              {client.transactions.map((tx, idx) => (
                <tr key={tx.id}>
                  <td className="py-3 pr-4 font-mono text-zinc-400">{idx + 1}</td>
                  <td className="py-3 pr-4 font-semibold text-zinc-950">{tx.item}</td>
                  <td className="py-3 pr-4 text-zinc-500">{formatDate(tx.date)}</td>
                  <td className="py-3 pr-4 font-mono text-zinc-500">{tx.tradeId || '-'}</td>
                  <td className="py-3 pr-4 text-center">
                    <span className="text-[10px] font-mono font-semibold px-2.5 py-1 rounded bg-zinc-100 text-zinc-800 border border-zinc-200 uppercase">
                      {statusLabels[tx.status] || tx.status}
                    </span>
                  </td>
                  <td className="py-3 text-right font-mono font-bold text-zinc-950">{formatCurrency(tx.price)}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="border-t border-zinc-300 font-bold text-zinc-950">
                <td colSpan={5} className="py-4 text-right uppercase tracking-wider text-[10px] text-zinc-400">Jami xarid hajmi:</td>
                <td className="py-4 text-right font-mono text-base text-zinc-950">{formatCurrency(client.totalSpent)}</td>
              </tr>
            </tfoot>
          </table>
        </div>

        {/* Note section */}
        <div className="mt-20 pt-6 border-t border-dashed border-zinc-200 text-[10px] text-zinc-400 text-center leading-relaxed">
          Sotib olingan buyumlar uchun to‘lov tasdiqlandi. Invoys CRM tizimi tomonidan avtomat ravishda chop etildi.<br />
          Sotuvchi va do‘kon ma‘muriyati nomidan xaridingiz uchun rahmat bildiramiz!
        </div>
      </div>

    </div>
  );
}

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, CheckCircle2, Loader2, Plus } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { persistBrowserDemoClient } from "@/lib/browser-demo-store";

type AddClientFormProps = {
  onCreated?: () => void;
};

export default function AddClientForm({ onCreated }: AddClientFormProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);
  const router = useRouter();

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const formData = new FormData(form);
    const payload = Object.fromEntries(formData);

    setLoading(true);
    setError("");
    setSaved(false);

    try {
      const response = await fetch("/api/clients", {
        method: "POST",
        body: JSON.stringify(payload),
        headers: { "Content-Type": "application/json" },
      });
      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data.error || "Mijoz saqlanmadi");
      }

      persistBrowserDemoClient(data);
      form.reset();
      setSaved(true);
      onCreated?.();
      router.refresh();
      window.setTimeout(() => {
        setSaved(false);
        setIsOpen(false);
      }, 700);
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Mijoz saqlanmadi");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="island" className="gap-2">
          <Plus size={18} />
          Mijoz qo‘shish
        </Button>
      </DialogTrigger>
      
      <DialogContent className="max-w-[560px] border-white/10 bg-[#090909] p-0 shadow-2xl doppelrand-inner overflow-hidden">
        <DialogHeader className="border-b border-white/10 p-6">
          <span className="text-[11px] font-medium uppercase tracking-[0.18em] text-red-300/80 mb-1 text-left">Mijoz bazasi</span>
          <DialogTitle className="text-2xl font-semibold tracking-tight text-white text-left">Yangi mijoz</DialogTitle>
          <DialogDescription className="max-w-[42ch] text-sm leading-6 text-white/50 text-left">
            Ismni kiriting. Skin va summa bo‘lsa, birinchi xarid ham avtomatik qo‘shiladi.
          </DialogDescription>
        </DialogHeader>

        <form className="flex flex-1 flex-col overflow-y-auto max-h-[70vh] p-6 custom-scrollbar" onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
            <label className="md:col-span-2">
              <span className="crm-label">Mijoz ismi</span>
              <input aria-required="true" className="crm-input" name="name" placeholder="Bekzod Karimov" required />
            </label>

            <label>
              <span className="crm-label">Telegram</span>
              <input className="crm-input" name="telegram" placeholder="@username" />
            </label>

            <label>
              <span className="crm-label">Telefon</span>
              <input className="crm-input" name="phone" placeholder="+998 90 000 00 00" />
            </label>

            <label>
              <span className="crm-label">Steam ID</span>
              <input className="crm-input" name="steamId" placeholder="7656119..." />
            </label>

          </div>

          <div className="my-6 h-px bg-white/10" />

          <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
            <label className="md:col-span-2">
              <span className="crm-label">Birinchi skin</span>
              <input className="crm-input" name="item" placeholder="AK-47 | Redline" />
            </label>

            <label>
              <span className="crm-label">Sotib olingan narx (Tannarxi), USD</span>
              <input className="crm-input" min="0" name="buyPrice" placeholder="400" step="0.01" type="number" />
            </label>
 
            <label>
              <span className="crm-label">Sotilgan narx (Summasi), USD</span>
              <input className="crm-input" min="0" name="price" placeholder="450" step="0.01" type="number" />
            </label>

            <label className="md:col-span-2">
              <span className="crm-label">Izoh</span>
              <textarea className="crm-input min-h-24 resize-none" name="notes" placeholder="Masalan: giveaway uchun faol mijoz" />
            </label>
          </div>

          {error && (
            <div className="mt-5 rounded-2xl border border-red-500/25 bg-red-500/10 px-4 py-3 text-sm text-red-100">
              {error}
            </div>
          )}

          {saved && (
            <div className="mt-5 flex items-center gap-3 rounded-2xl border border-emerald-500/25 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-100">
              <CheckCircle2 size={18} />
              Mijoz saqlandi.
            </div>
          )}

          <div className="mt-6 flex flex-col gap-3 sm:flex-row pt-4 border-t border-white/10">
            <Button
              className="flex-1 rounded-2xl bg-white text-black hover:bg-white/90 h-12 text-[15px] font-semibold"
              disabled={loading}
              type="submit"
            >
              {loading ? <Loader2 className="animate-spin mr-2" size={18} /> : <ArrowRight className="mr-2" size={18} />}
              {loading ? "Saqlanmoqda" : "Mijozni saqlash"}
            </Button>
            <Button
              variant="outline"
              className="rounded-2xl border-white/10 bg-transparent text-white/70 hover:bg-white/[0.06] hover:text-white h-12 px-6"
              disabled={loading}
              onClick={() => setIsOpen(false)}
              type="button"
            >
              Bekor qilish
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

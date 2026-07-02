"use client";

import { useMemo, useState, useEffect, useRef } from "react";
import Link from "next/link";
import { 
  ArrowRight, 
  Crown, 
  RotateCcw, 
  Shuffle, 
  Sparkles, 
  Ticket, 
  Trophy, 
  UsersRound, 
  X, 
  Volume2, 
  VolumeX, 
  Clock
} from "lucide-react";

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

interface Confetti {
  x: number;
  y: number;
  size: number;
  color: string;
  speedX: number;
  speedY: number;
  rotation: number;
  rotationSpeed: number;
  opacity: number;
}

// ----------------------------------------------------
// 1. Web Audio API Engine for Synthesized Sound Effects
// ----------------------------------------------------
class AudioEngine {
  private ctx: AudioContext | null = null;

  init() {
    if (!this.ctx && typeof window !== "undefined") {
      const AudioCtx = window.AudioContext || (window as unknown as Window & { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
  }

  playTick() {
    try {
      this.init();
      if (!this.ctx) return;
      if (this.ctx.state === "suspended") {
        this.ctx.resume();
      }

      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = "sine";
      osc.frequency.setValueAtTime(850, now);
      // Fast pitch drop for a crisp mechanical "tack" or "tick" sound
      osc.frequency.exponentialRampToValueAtTime(180, now + 0.035);

      gain.gain.setValueAtTime(0.06, now);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.03);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.035);
    } catch (e) {
      console.warn("Audio tick fail:", e);
    }
  }

  playFanfare() {
    try {
      this.init();
      if (!this.ctx) return;
      if (this.ctx.state === "suspended") {
        this.ctx.resume();
      }

      const now = this.ctx.currentTime;

      // Clean C Major arpeggio that rolls up, followed by a bright chime
      const arpeggio = [261.63, 329.63, 392.00, 523.25]; // C4, E4, G4, C5
      arpeggio.forEach((freq, idx) => {
        const timeOffset = idx * 0.12;
        const osc = this.ctx!.createOscillator();
        const gain = this.ctx!.createGain();

        osc.type = "triangle"; // Warm retro brass sound
        osc.frequency.setValueAtTime(freq, now + timeOffset);
        
        gain.gain.setValueAtTime(0, now + timeOffset);
        gain.gain.linearRampToValueAtTime(0.08, now + timeOffset + 0.05);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + timeOffset + 1.2);

        osc.connect(gain);
        gain.connect(this.ctx!.destination);

        osc.start(now + timeOffset);
        osc.stop(now + timeOffset + 1.3);
      });

      // A high, clear, sparkling sine chime at C6
      const chimeOsc = this.ctx.createOscillator();
      const chimeGain = this.ctx.createGain();

      chimeOsc.type = "sine";
      chimeOsc.frequency.setValueAtTime(1046.50, now + 0.45);
      
      chimeGain.gain.setValueAtTime(0, now + 0.45);
      chimeGain.gain.linearRampToValueAtTime(0.07, now + 0.5);
      chimeGain.gain.exponentialRampToValueAtTime(0.0001, now + 1.8);

      chimeOsc.connect(chimeGain);
      chimeGain.connect(this.ctx.destination);

      chimeOsc.start(now + 0.45);
      chimeOsc.stop(now + 1.9);
    } catch (e) {
      console.warn("Audio fanfare fail:", e);
    }
  }
}

const audioEngine = new AudioEngine();

function formatUsd(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value);
}

// ----------------------------------------------------
// 2. Unbiased & Uncapped Ticket Calculation System
// ----------------------------------------------------
function getTicketBreakdown(client: GiveawayClient) {
  const completedTrades = client.transactions.filter((trade) => trade.status === "COMPLETED").length;
  
  // Base ticket for having active completed transactions
  const base = completedTrades > 0 ? 1 : 0;
  
  // Purchase weight: 2 tickets per completed trade
  const tradeTickets = completedTrades * 2;
  
  // Spend weight: 1 ticket per $100 spent
  const spendTickets = Math.floor(client.totalSpent / 100);
  
  // Volume purchase bonuses (additive)
  let volumeBonus = 0;
  if (completedTrades >= 20) {
    volumeBonus = 40;
  } else if (completedTrades >= 10) {
    volumeBonus = 15;
  } else if (completedTrades >= 5) {
    volumeBonus = 5;
  }

  // Spend value bonuses (additive)
  let spendBonus = 0;
  if (client.totalSpent >= 10000) {
    spendBonus = 150;
  } else if (client.totalSpent >= 5000) {
    spendBonus = 50;
  } else if (client.totalSpent >= 1000) {
    spendBonus = 10;
  }

  const total = base + tradeTickets + spendTickets + volumeBonus + spendBonus;

  return {
    base,
    completedTrades,
    tradeTickets,
    spendTickets,
    volumeBonus,
    spendBonus,
    total: Math.max(1, total) // At least 1 ticket guarantee if eligible
  };
}

function ticketCount(client: GiveawayClient) {
  return getTicketBreakdown(client).total;
}

// Secure random selection
function secureRandom() {
  if (typeof window === "undefined" || !window.crypto) return Math.random();
  const values = new Uint32Array(1);
  window.crypto.getRandomValues(values);
  return values[0] / 4294967296;
}

// Pick a winner using ticket weights
function pickWinner(pool: GiveawayClient[]) {
  const totalTickets = pool.reduce((sum, client) => sum + ticketCount(client), 0);
  let cursor = secureRandom() * totalTickets;

  for (const client of pool) {
    cursor -= ticketCount(client);
    if (cursor <= 0) return client;
  }

  return pool[0] ?? null;
}

// Pick a random client weighted by tickets (used to populate reel slots with realistic probability)
function pickWeightedClient(pool: GiveawayClient[]) {
  const total = pool.reduce((sum, c) => sum + ticketCount(c), 0);
  let r = Math.random() * total;
  for (const c of pool) {
    r -= ticketCount(c);
    if (r <= 0) return c;
  }
  return pool[0];
}

export default function GiveawayRandomizer({ clients }: GiveawayRandomizerProps) {
  const [winner, setWinner] = useState<GiveawayClient | null>(null);
  const [rollCount, setRollCount] = useState(0);
  
  // Configurations (stored in localStorage)
  const [spinDuration, setSpinDuration] = useState<number>(20);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  
  // Cinema Mode States
  const [cinemaActive, setCinemaActive] = useState(false);
  const [isSpinning, setIsSpinning] = useState(false);
  const [reelCards, setReelCards] = useState<GiveawayClient[]>([]);
  const [translateX, setTranslateX] = useState(0);
  const [showWinnerCard, setShowWinnerCard] = useState(false);

  // Canvas Confetti refs
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const confettiAnimId = useRef<number | null>(null);
  const confettiParticles = useRef<Confetti[]>([]);
  
  // Reel measurements
  const cardWidth = 200;
  const cardGap = 16;
  const cardStep = cardWidth + cardGap;
  const winnerTargetIndex = 85;

  const reelRef = useRef<HTMLDivElement | null>(null);
  const frameId = useRef<number | null>(null);
  const lastTickedIndexRef = useRef<number>(-1);

  // Load configs from local storage
  useEffect(() => {
    const savedDuration = localStorage.getItem("giveaway_spin_duration");
    const savedSound = localStorage.getItem("giveaway_sound_enabled");

    const timer = setTimeout(() => {
      if (savedDuration) setSpinDuration(parseInt(savedDuration, 10));
      if (savedSound) setSoundEnabled(savedSound !== "false");
    }, 0);

    return () => clearTimeout(timer);
  }, []);

  const handleSetDuration = (duration: number) => {
    setSpinDuration(duration);
    localStorage.setItem("giveaway_spin_duration", duration.toString());
  };

  const handleSetSound = (enabled: boolean) => {
    setSoundEnabled(enabled);
    localStorage.setItem("giveaway_sound_enabled", enabled ? "true" : "false");
  };

  const eligibleClients = useMemo(
    () => clients.filter((client) => client.transactions.some((trade) => trade.status === "COMPLETED")),
    [clients],
  );

  const totalTickets = useMemo(
    () => eligibleClients.reduce((sum, client) => sum + ticketCount(client), 0),
    [eligibleClients],
  );

  // ----------------------------------------------------
  // Confetti Physics Engine
  // ----------------------------------------------------
  const startConfetti = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    confettiParticles.current = [];
    // Premium theme-aligned colors: Crimson red, Gold, Sky blue, Emerald, Pink, White
    const colors = ["#ef4444", "#f59e0b", "#3b82f6", "#10b981", "#ec4899", "#f43f5e", "#d97706", "#ffffff"];
    
    // Spawn particles from bottom-left and bottom-right corners
    const count = 180;
    for (let i = 0; i < count; i++) {
      const isLeft = i < count / 2;
      const x = isLeft ? 0 : canvas.width;
      const y = canvas.height;
      const size = Math.random() * 8 + 6;
      const color = colors[Math.floor(Math.random() * colors.length)];
      
      const speedX = isLeft 
        ? Math.random() * 16 + 10 
        : -(Math.random() * 16 + 10);
      const speedY = -(Math.random() * 22 + 15);
      
      confettiParticles.current.push({
        x,
        y,
        size,
        color,
        speedX,
        speedY,
        rotation: Math.random() * 360,
        rotationSpeed: Math.random() * 4 - 2,
        opacity: 1
      });
    }

    const animateConfetti = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      let active = false;

      confettiParticles.current.forEach((p) => {
        if (p.opacity <= 0) return;
        active = true;

        p.x += p.speedX;
        p.y += p.speedY;
        p.speedY += 0.22; // gravity
        p.speedX *= 0.98; // friction
        p.speedY *= 0.98;
        p.rotation += p.rotationSpeed;
        
        if (p.speedY > 0) {
          p.opacity -= 0.007; // fade out as they drop
        }

        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate((p.rotation * Math.PI) / 180);
        ctx.globalAlpha = Math.max(0, p.opacity);
        ctx.fillStyle = p.color;
        ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size);
        ctx.restore();
      });

      if (active) {
        confettiAnimId.current = requestAnimationFrame(animateConfetti);
      }
    };

    if (confettiAnimId.current) {
      cancelAnimationFrame(confettiAnimId.current);
    }
    confettiAnimId.current = requestAnimationFrame(animateConfetti);
  };

  // Recalculate centering when window resizes
  useEffect(() => {
    const handleResize = () => {
      if (cinemaActive && winner && reelCards.length > 0) {
        const centerX = window.innerWidth / 2;
        const targetOffset = centerX - (winnerTargetIndex * cardStep + cardWidth / 2);
        
        // Match the sizing based on whether it is currently spinning or stopped
        if (!isSpinning) {
          setTranslateX(targetOffset);
        }
      }
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [cinemaActive, winner, isSpinning, reelCards, cardStep, cardWidth]);

  // Run the full-screen cinematic randomizer
  function runRandomizer() {
    if (eligibleClients.length === 0 || cinemaActive) return;

    // 1. Synthesize audio contexts on first user gesture
    if (soundEnabled) {
      audioEngine.init();
    }

    // 2. Select the true winner beforehand using weighted secure tickets
    const selectedWinner = pickWinner(eligibleClients);
    if (!selectedWinner) return;

    setWinner(selectedWinner);
    setShowWinnerCard(false);

    // 3. Generate a beautiful, weighted 100-card reel
    const tempReel: GiveawayClient[] = [];
    for (let i = 0; i < 100; i++) {
      if (i === winnerTargetIndex) {
        // Place true winner at the target slot
        tempReel.push(selectedWinner);
      } else {
        // Populated weighted random clients to display realistic ticket density
        tempReel.push(pickWeightedClient(eligibleClients));
      }
    }
    setReelCards(tempReel);

    // 4. Position reel at starting offset (centered on card 0)
    const initialCenterX = typeof window !== "undefined" ? window.innerWidth / 2 : 500;
    const initialOffset = initialCenterX - cardWidth / 2;
    setTranslateX(initialOffset);
    
    // 5. Open cinematic mode screen
    setCinemaActive(true);
    setIsSpinning(false);
    lastTickedIndexRef.current = -1;

    // 6. Trigger spin transition in the next render frame
    setTimeout(() => {
      const centerX = window.innerWidth / 2;
      const targetOffset = centerX - (winnerTargetIndex * cardStep + cardWidth / 2);
      
      setIsSpinning(true);
      setTranslateX(targetOffset);

      // Start the requestAnimationFrame ticker monitor
      const monitorTicks = () => {
        if (reelRef.current) {
          const rect = reelRef.current.getBoundingClientRect();
          const reelLeft = rect.left;
          const markerX = window.innerWidth / 2;

          // Compute which card is currently at the center pointer
          const currentFloatIndex = (markerX - reelLeft - cardWidth / 2) / cardStep;
          const nearestIndex = Math.round(currentFloatIndex);

          if (nearestIndex !== lastTickedIndexRef.current) {
            // Play mechanical ticking click sound on crossing
            if (soundEnabled && nearestIndex >= 0 && nearestIndex < tempReel.length) {
              audioEngine.playTick();
            }
            lastTickedIndexRef.current = nearestIndex;
          }
        }
        frameId.current = requestAnimationFrame(monitorTicks);
      };
      
      frameId.current = requestAnimationFrame(monitorTicks);
    }, 60);

    // 7. Schedule stop and reveal
    setTimeout(() => {
      // End animation ticks
      if (frameId.current) {
        cancelAnimationFrame(frameId.current);
      }
      
      setIsSpinning(false);
      setShowWinnerCard(true);
      setRollCount((prev) => prev + 1);

      // Launch particles and fanfare
      startConfetti();
      if (soundEnabled) {
        audioEngine.playFanfare();
      }
    }, spinDuration * 1000 + 60);
  }

  function resetWinner() {
    setWinner(null);
    setCinemaActive(false);
    setIsSpinning(false);
    setShowWinnerCard(false);
    setReelCards([]);
    if (frameId.current) cancelAnimationFrame(frameId.current);
    if (confettiAnimId.current) cancelAnimationFrame(confettiAnimId.current);
  }

  return (
    <div className="flex w-full max-w-full flex-col gap-8 overflow-hidden">
      {/* -------------------- MAIN DISPLAY -------------------- */}
      <section className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        
        {/* RANDOMIZER PANEL */}
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
              G&apos;olib yakunlangan xaridi bor mijozlar orasidan tanlanadi. Yangilangan formulamiz chiptalarni xarid soni va jami sarflangan summaga qarab, yuqori xaridorlarga hech qanday cheklovsiz chipta ulashadi.
            </p>
          </div>

          {/* STREAM DEMO PREVIEW BOX */}
          <div className="overflow-hidden rounded-[2rem] border border-white/10 bg-black/35 p-5">
            <div className="flex items-center justify-between mb-3 text-xs text-white/40">
              <span>Mijozlar chiptalari asosida g&apos;oliblik ehtimoli</span>
              <span className="font-mono">{eligibleClients.length} ta faol mijoz</span>
            </div>
            
            <div className="flex flex-wrap gap-2 max-h-36 overflow-y-auto custom-scrollbar p-1">
              {eligibleClients.length > 0 ? (
                eligibleClients.map((client) => {
                  const bd = getTicketBreakdown(client);
                  return (
                    <div 
                      key={client.id} 
                      className="flex items-center gap-2 rounded-xl border border-white/5 bg-[#121214] px-3 py-1.5 text-xs text-white/80"
                    >
                      <span className="font-semibold truncate max-w-[90px]">{client.name}</span>
                      <span className="flex items-center gap-1 rounded bg-red-500/10 px-1.5 py-0.5 font-mono text-[10px] text-red-300">
                        <Ticket size={10} />
                        {bd.total}
                      </span>
                    </div>
                  );
                })
              ) : (
                <div className="text-sm text-white/30 py-4 w-full text-center">Faol xaridorlar mavjud emas.</div>
              )}
            </div>
          </div>

          {/* ACTION BUTTONS */}
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <button
              className="inline-flex flex-1 items-center justify-center gap-3 rounded-2xl border border-red-400/30 bg-red-500 px-5 py-4 text-[15px] font-semibold text-white shadow-[0_18px_55px_rgba(239,68,68,0.22)] transition-all duration-200 hover:-translate-y-0.5 hover:bg-red-400 active:translate-y-0 disabled:pointer-events-none disabled:opacity-50 active:scale-[0.98]"
              disabled={eligibleClients.length === 0}
              onClick={runRandomizer}
              type="button"
            >
              <Shuffle size={18} />
              G&apos;olibni aniqlash (Cinema)
            </button>
            <button
              className="inline-flex items-center justify-center gap-3 rounded-2xl border border-white/10 px-5 py-4 text-[15px] font-medium text-white/70 transition-colors hover:bg-white/[0.06] hover:text-white active:scale-[0.98]"
              onClick={resetWinner}
              type="button"
            >
              <RotateCcw size={18} />
              Tozalash
            </button>
          </div>
        </div>

        {/* SIDE PANEL: CONFIGURATIONS & RULES */}
        <aside className="flex flex-col gap-6 min-w-0">
          
          {/* CONFIGURATIONS CARD */}
          <div className="doppelrand">
            <div className="doppelrand-inner p-6 flex flex-col gap-5">
              <div className="flex items-center gap-2 text-white">
                <Clock className="text-red-400" size={20} />
                <h3 className="text-lg font-medium">Randomizator sozlamalari</h3>
              </div>
              
              {/* duration select */}
              <div className="flex flex-col gap-2">
                <label className="text-xs font-mono uppercase tracking-wider text-white/40">Aylanish vaqti (soniya)</label>
                <div className="grid grid-cols-4 gap-1.5">
                  {[10, 20, 40, 60].map((d) => (
                    <button
                      key={d}
                      type="button"
                      className={`py-2 px-1 rounded-xl font-mono text-xs border text-center transition-all ${
                        spinDuration === d 
                          ? "bg-red-500/10 border-red-500/50 text-red-200 font-semibold"
                          : "border-white/5 bg-white/[0.02] text-white/50 hover:bg-white/5 hover:text-white"
                      }`}
                      onClick={() => handleSetDuration(d)}
                    >
                      {d}s {d === 20 ? "(Standart)" : ""}
                    </button>
                  ))}
                </div>
                
                {/* range slider */}
                <div className="mt-2 flex items-center gap-3">
                  <input
                    type="range"
                    min="5"
                    max="120"
                    value={spinDuration}
                    onChange={(e) => handleSetDuration(parseInt(e.target.value, 10))}
                    className="flex-1 h-1 bg-white/10 rounded-lg appearance-none cursor-pointer accent-red-500"
                  />
                  <span className="font-mono text-sm text-red-300 w-8 text-right font-semibold">{spinDuration}s</span>
                </div>
              </div>

              {/* Sound Toggle */}
              <div className="flex items-center justify-between border-t border-white/5 pt-4">
                <div className="flex flex-col">
                  <span className="text-xs font-semibold text-white/80">Ovoz effektlari</span>
                  <span className="text-[10px] text-white/40">Mexanik aylanma tik ovozlari va tantana ovozi</span>
                </div>
                <button
                  type="button"
                  onClick={() => handleSetSound(!soundEnabled)}
                  className={`flex size-10 items-center justify-center rounded-xl border transition-all ${
                    soundEnabled 
                      ? "border-red-500/30 bg-red-500/10 text-red-300"
                      : "border-white/10 bg-white/5 text-white/40"
                  }`}
                  title={soundEnabled ? "Ovoz faol" : "Ovoz o'chirilgan"}
                >
                  {soundEnabled ? <Volume2 size={18} /> : <VolumeX size={18} />}
                </button>
              </div>
            </div>
          </div>

          {/* RULES CARD */}
          <div className="doppelrand">
            <div className="doppelrand-inner flex flex-col justify-between p-6">
              <div className="flex flex-col gap-4">
                <div className="flex items-center gap-2">
                  <Crown className="text-amber-400" size={20} />
                  <h3 className="text-lg font-medium text-white">Chiptalar taqsimoti</h3>
                </div>
                <div className="text-xs space-y-2.5 text-white/50 leading-relaxed">
                  <p>Adolatli va shaffof bo&apos;lishi uchun chiptalar quyidagi formula bo&apos;yicha hisoblanadi:</p>
                  <ul className="list-disc pl-4 space-y-1.5">
                    <li>Har bir faol xaridorga: <strong className="text-white">1 ta chipta (Asos)</strong></li>
                    <li>Har bir muvaffaqiyatli xaridga: <strong className="text-white">2 ta chipta (Hajm)</strong></li>
                    <li>Har sarflangan $100 uchun: <strong className="text-white">1 ta chipta (Qiymat)</strong></li>
                  </ul>
                  <div className="rounded-xl border border-amber-500/10 bg-amber-500/[0.03] p-2.5 text-[11px] text-amber-200/70">
                    <span className="font-semibold block mb-0.5 text-amber-300">Sarflangan summa bonuslari (Qo&apos;shimcha):</span>
                    $1,000+ uchun: +10 | $5,000+ uchun: +50 | $10,000+ uchun: +150
                  </div>
                  <div className="rounded-xl border border-red-500/10 bg-red-500/[0.03] p-2.5 text-[11px] text-red-200/70">
                    <span className="font-semibold block mb-0.5 text-red-300">Xaridlar soni bonuslari (Qo&apos;shimcha):</span>
                    5+ ta xarid: +5 | 10+ ta xarid: +15 | 20+ ta xarid: +40
                  </div>
                  <p className="text-[11px] italic text-white/30 border-t border-white/5 pt-2">
                    Cheklovlar yo&apos;q! Ko&apos;p xarid qilganlar chiptalar sonini mutanosib ravishda ko&apos;paytiradilar.
                  </p>
                </div>
              </div>

              <div className="mt-6 grid grid-cols-3 gap-3 border-t border-white/10 pt-4">
                <div>
                  <UsersRound className="mb-2 text-white/40" size={16} />
                  <strong className="block font-mono text-lg text-white">{eligibleClients.length}</strong>
                  <span className="text-[10px] text-white/40 block">ishtirokchi</span>
                </div>
                <div>
                  <Ticket className="mb-2 text-white/40" size={16} />
                  <strong className="block font-mono text-lg text-white">{totalTickets}</strong>
                  <span className="text-[10px] text-white/40 block">chipta jami</span>
                </div>
                <div>
                  <Shuffle className="mb-2 text-white/40" size={16} />
                  <strong className="block font-mono text-lg text-white">{rollCount}</strong>
                  <span className="text-[10px] text-white/40 block">urinish</span>
                </div>
              </div>
            </div>
          </div>
        </aside>
      </section>

      {/* -------------------- PARTICIPANTS TABLE -------------------- */}
      <section className="doppelrand">
        <div className="doppelrand-inner flex flex-col gap-6 p-6">
          <div className="flex flex-col justify-between gap-3 border-b border-white/5 pb-4 md:flex-row md:items-center">
            <div>
              <h2 className="text-xl font-medium text-white">Ishtirokchilar va chiptalar jadvali</h2>
              <p className="mt-1 text-xs text-white/40">G&apos;oliblik ehtimoli chiptalar soniga mutanosib ravishda taqsimlangan.</p>
            </div>
            <span className="w-max rounded bg-white/5 px-2 py-1 font-mono text-xs text-white/40">{eligibleClients.length} ta faol</span>
          </div>

          <div className="custom-scrollbar overflow-x-auto">
            <table className="w-full min-w-[850px] border-collapse text-left text-sm text-white/70">
              <thead>
                <tr className="border-b border-white/5 font-mono text-[11px] uppercase tracking-widest text-white/35">
                  <th className="px-4 py-3">Mijoz</th>
                  <th className="px-4 py-3">Aloqa</th>
                  <th className="px-4 py-3">Jami xarid</th>
                  <th className="px-4 py-3 text-center">Xaridlar soni</th>
                  <th className="px-4 py-3">Chipta shakllanishi</th>
                  <th className="px-4 py-3 text-right">Ehtimollik</th>
                  <th className="px-4 py-3 text-right">Jami chipta</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {eligibleClients
                  .slice()
                  .sort((a, b) => ticketCount(b) - ticketCount(a))
                  .map((client) => {
                    const bd = getTicketBreakdown(client);
                    const probability = totalTickets > 0 ? Math.round((bd.total / totalTickets) * 100) : 0;
                    
                    return (
                      <tr className="transition-colors hover:bg-white/[0.015]" key={client.id}>
                        <td className="px-4 py-3.5 font-medium text-white">
                          <Link className="transition-colors hover:text-red-300" href={`/clients/${client.id}`}>
                            {client.name}
                          </Link>
                        </td>
                        <td className="px-4 py-3.5 font-mono text-white/40">{client.telegram || client.phone || "-"}</td>
                        <td className="px-4 py-3.5 font-mono">{formatUsd(client.totalSpent)}</td>
                        <td className="px-4 py-3.5 font-mono text-center">{bd.completedTrades} ta</td>
                        <td className="px-4 py-3.5 text-xs">
                          <div className="flex flex-col gap-0.5 text-white/40">
                            <div>
                              <span className="text-white/60">Asos:</span> 1 
                              <span className="mx-1.5">|</span> 
                              <span className="text-white/60">Xarid:</span> {bd.tradeTickets} ({bd.completedTrades}x2) 
                              <span className="mx-1.5">|</span> 
                              <span className="text-white/60">Qiymat:</span> {bd.spendTickets}
                            </div>
                            {(bd.volumeBonus > 0 || bd.spendBonus > 0) && (
                              <div className="text-amber-400/80 font-medium">
                                Bonuslar: {bd.volumeBonus > 0 ? `+${bd.volumeBonus} (Hajm)` : ""} {bd.spendBonus > 0 ? `+${bd.spendBonus} (Qiymat)` : ""}
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-3.5 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <span className="font-mono text-white/80">{probability}%</span>
                            <div className="hidden h-1.5 w-16 overflow-hidden rounded-full bg-white/5 sm:block">
                              <div className="h-full bg-red-500" style={{ width: `${probability}%`, backgroundColor: "var(--cs-accent)" }} />
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3.5 text-right">
                          <span className="inline-flex items-center gap-1.5 rounded-full border border-red-500/20 bg-red-500/10 px-2.5 py-1 font-mono text-xs text-red-200">
                            <Ticket size={12} />
                            {bd.total}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                {eligibleClients.length === 0 && (
                  <tr>
                    <td className="py-12 text-center font-mono text-white/30" colSpan={7}>
                      Faol ishtirokchilar mavjud emas. Mijozning kamida bitta yakunlangan xaridi bo&apos;lishi shart.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* -------------------- CINEMA SPIN OVERLAY -------------------- */}
      {cinemaActive && (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-neutral-950/98 p-4 backdrop-blur-3xl transition-opacity duration-300">
          <canvas ref={canvasRef} className="pointer-events-none fixed inset-0 z-[120]" />
          
          <div className="relative flex w-full max-w-7xl flex-col items-center justify-center gap-10">
            
            {/* Upper Header: suspense states */}
            <div className="text-center flex flex-col items-center gap-3">
              <div className="animate-pulse flex items-center gap-2 rounded-full border border-red-500/20 bg-red-500/5 px-4 py-1 text-xs font-semibold text-red-300 uppercase tracking-widest">
                <Sparkles size={12} className="text-red-400" />
                {isSpinning ? "Omadli g'olib aniqlanmoqda" : showWinnerCard ? "G'olib aniqlandi!" : "Tayyorlanmoqda..."}
              </div>
              <h2 className="text-4xl md:text-5xl font-bold text-white tracking-tight leading-none mt-2">
                OneStore Omadli Mijoz
              </h2>
              <p className="text-sm text-white/40 max-w-[50ch]">
                {isSpinning ? "Chipta ulushlari bo'yicha aylanish jarayoni yakunlanishini kuting..." : "Tadbir muvaffaqiyatli yakunlandi!"}
              </p>
            </div>

            {/* THE HORIZONTAL REEL SPINNER CONTAINER */}
            <div className="relative w-full max-w-4xl overflow-hidden rounded-[2.5rem] border border-white/10 bg-[#0d0d0f]/80 py-12 px-2 shadow-2xl backdrop-blur-xl">
              
              {/* Pointer Center Indicator (vertical bar) */}
              <div className="absolute top-0 bottom-0 left-1/2 z-30 w-1 -translate-x-1/2 pointer-events-none">
                <div className="h-full w-full bg-red-500 shadow-[0_0_24px_#ef4444]" />
                <div className="absolute top-0 left-1/2 -translate-x-1/2 border-l-[10px] border-l-transparent border-r-[10px] border-r-transparent border-t-[14px] border-t-red-500 drop-shadow-[0_4px_8px_rgba(239,68,68,0.5)]" />
                <div className="absolute bottom-0 left-1/2 -translate-x-1/2 border-l-[10px] border-l-transparent border-r-[10px] border-r-transparent border-b-[14px] border-b-red-500 drop-shadow-[0_-4px_8px_rgba(239,68,68,0.5)]" />
              </div>

              {/* Gradient overlays to shade the left and right edges */}
              <div className="pointer-events-none absolute inset-y-0 left-0 z-20 w-36 bg-gradient-to-r from-[#0d0d0f] to-transparent" />
              <div className="pointer-events-none absolute inset-y-0 right-0 z-20 w-36 bg-gradient-to-l from-[#0d0d0f] to-transparent" />

              {/* Scrolling tape */}
              <div className="w-full overflow-hidden">
                <div
                  ref={reelRef}
                  className="flex items-center select-none"
                  style={{
                    gap: `${cardGap}px`,
                    transform: `translateX(${translateX}px)`,
                    transition: isSpinning ? `transform ${spinDuration}s cubic-bezier(0.06, 0.8, 0.15, 1)` : "none",
                    willChange: "transform",
                    width: "max-content"
                  }}
                >
                  {reelCards.map((client, idx) => {
                    const isWinnerIdx = idx === winnerTargetIndex;
                    const isStopped = !isSpinning && showWinnerCard;
                    
                    return (
                      <div
                        key={`${client.id}-${idx}`}
                        style={{ width: `${cardWidth}px` }}
                        className={`h-[150px] shrink-0 rounded-2xl border bg-gradient-to-b p-5 flex flex-col justify-between transition-all duration-700 ${
                          isWinnerIdx && isStopped
                            ? "border-amber-500 bg-amber-950/20 shadow-[0_0_35px_rgba(245,158,11,0.5)] scale-105 z-10"
                            : "border-white/10 bg-neutral-900/50"
                        }`}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex size-9 items-center justify-center rounded-xl bg-white/5 border border-white/10 text-white/55">
                            {isWinnerIdx && isStopped ? (
                              <Trophy size={16} className="text-amber-400 animate-bounce" />
                            ) : (
                              <UsersRound size={16} />
                            )}
                          </div>
                          
                          {/* Ticket badge inside reel card */}
                          <div className={`flex items-center gap-1 rounded-full px-2 py-0.5 font-mono text-[10px] ${
                            isWinnerIdx && isStopped
                              ? "bg-amber-500/20 text-amber-300"
                              : "bg-red-500/10 text-red-300"
                          }`}>
                            <Ticket size={8} />
                            {ticketCount(client)}
                          </div>
                        </div>

                        <div className="mt-4">
                          <h4 className="font-bold text-white text-sm truncate">{client.name}</h4>
                          <p className="text-[10px] text-white/40 truncate mt-0.5">
                            {client.telegram || client.phone || "ID: " + client.id.slice(0, 6)}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Countdown / Progress slider */}
            {isSpinning && (
              <div className="w-full max-w-md flex flex-col gap-1.5 items-center">
                <div className="w-full h-1 bg-white/5 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-red-500"
                    style={{
                      width: "100%",
                      animation: `giveaway-countdown ${spinDuration}s linear forwards`
                    }}
                  />
                </div>
                <span className="text-[10px] font-mono text-white/35 uppercase tracking-widest mt-1">
                  Aylanish vaqti: {spinDuration} soniya
                </span>
              </div>
            )}

            {/* -------------------- WINNER DETAIL CARD -------------------- */}
            {showWinnerCard && winner && (
              <div className="w-full max-w-xl animate-in zoom-in-95 duration-500 z-[130]">
                <div className="absolute inset-0 -z-10 rounded-[2.5rem] bg-amber-500/5 blur-[80px]" />
                
                <div className="doppelrand">
                  <div className="doppelrand-inner flex flex-col gap-6 p-7 md:p-8 bg-[#0a0a0c]">
                    
                    <button
                      aria-label="Yopish"
                      className="absolute right-5 top-5 flex size-10 items-center justify-center rounded-full border border-white/10 bg-black/60 text-white/60 transition-colors hover:text-white"
                      onClick={resetWinner}
                      type="button"
                    >
                      <X size={18} />
                    </button>

                    <div className="flex items-center gap-4">
                      <div className="flex size-14 items-center justify-center rounded-2xl border border-amber-500/30 bg-amber-500/10 text-amber-300">
                        <Trophy size={28} className="animate-pulse" />
                      </div>
                      <div>
                        <p className="font-mono text-[10px] uppercase tracking-[0.25em] text-amber-400 font-semibold">Tadbir g&apos;olibi</p>
                        <h3 className="text-3xl font-bold tracking-tight text-white mt-0.5">{winner.name}</h3>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3 mt-2">
                      <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-4">
                        <p className="mb-1 font-mono text-[10px] uppercase tracking-wider text-white/40">Jami chiptalar</p>
                        <strong className="font-mono text-2xl text-white block">{ticketCount(winner)} ta</strong>
                        <span className="text-[10px] text-white/35 block mt-0.5">
                          Ehtimollik: {totalTickets > 0 ? Math.round((ticketCount(winner) / totalTickets) * 100) : 0}%
                        </span>
                      </div>
                      <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-4">
                        <p className="mb-1 font-mono text-[10px] uppercase tracking-wider text-white/40">Jami sarflangan</p>
                        <strong className="font-mono text-2xl text-emerald-400 block">{formatUsd(winner.totalSpent)}</strong>
                        <span className="text-[10px] text-white/35 block mt-0.5">
                          Xaridlar: {winner.transactions.filter(t => t.status === "COMPLETED").length} ta
                        </span>
                      </div>
                    </div>

                    <div className="grid gap-2.5 border-t border-white/5 pt-4 text-sm mt-1">
                      <div className="flex justify-between gap-4">
                        <span className="text-white/40">Telegram</span>
                        <strong className="text-right text-amber-200/90 font-medium">{winner.telegram || "Ko'rsatilmagan"}</strong>
                      </div>
                      <div className="flex justify-between gap-4">
                        <span className="text-white/40">Telefon raqami</span>
                        <strong className="text-right text-white font-mono">{winner.phone || "Ko'rsatilmagan"}</strong>
                      </div>
                    </div>

                    <div className="mt-4 flex gap-3">
                      <Link
                        className="inline-flex flex-1 items-center justify-center gap-2.5 rounded-2xl bg-white px-5 py-4 text-[15px] font-semibold text-black transition-all duration-200 hover:-translate-y-0.5 hover:bg-white/90 active:scale-[0.98]"
                        href={`/clients/${winner.id}`}
                        onClick={resetWinner}
                      >
                        Mijoz sahifasiga o&apos;tish
                        <ArrowRight size={17} />
                      </Link>
                      <button
                        type="button"
                        onClick={resetWinner}
                        className="inline-flex items-center justify-center gap-2 rounded-2xl border border-white/10 px-5 py-4 text-[15px] font-medium text-white/60 transition-colors hover:bg-white/5 hover:text-white active:scale-[0.98]"
                      >
                        Yopish
                      </button>
                    </div>

                  </div>
                </div>
              </div>
            )}
            
          </div>
        </div>
      )}
    </div>
  );
}

"use client";

export type BrowserDemoTransaction = {
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
};

export type BrowserDemoClient = {
  id: string;
  name: string;
  phone: string | null;
  telegram: string | null;
  steamId?: string | null;
  externalId?: string | null;
  preferredCurrency?: string;
  notes?: string | null;
  totalSpent: number;
  createdAt: string;
  updatedAt?: string;
  lastSeenAt?: string | null;
  transactions: BrowserDemoTransaction[];
};

type BrowserDemoClientInput = Omit<Partial<BrowserDemoClient>, "transactions"> & {
  transactions?: Array<Partial<BrowserDemoTransaction>>;
};

type TradeWithClient = BrowserDemoTransaction & {
  client: {
    id: string;
    name: string;
    telegram: string | null;
    phone: string | null;
    steamId: string | null;
  };
};

const STORAGE_KEY = "onepstore.browser-demo-clients.v1";
const CHANGE_EVENT = "onepstore-browser-demo-store-change";

function isBrowser() {
  return typeof window !== "undefined";
}

function nowIso() {
  return new Date().toISOString();
}

function toStringOrNull(value: unknown) {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function toNumber(value: unknown, fallback = 0) {
  const parsed = typeof value === "number" ? value : Number.parseFloat(String(value ?? ""));
  return Number.isFinite(parsed) ? parsed : fallback;
}

function completedTotal(transactions: BrowserDemoTransaction[]) {
  return transactions
    .filter((transaction) => transaction.status === "COMPLETED")
    .reduce((sum, transaction) => sum + transaction.price, 0);
}

function normalizeTransaction(transaction: Partial<BrowserDemoTransaction>, clientId: string): BrowserDemoTransaction {
  const price = toNumber(transaction.price);

  return {
    id: transaction.id || `demo-tx-${crypto.randomUUID()}`,
    clientId,
    tradeId: toStringOrNull(transaction.tradeId),
    item: String(transaction.item || "Skin"),
    price,
    marginUsd: toNumber(transaction.marginUsd, price),
    status: transaction.status || "COMPLETED",
    rarity: transaction.rarity || "Restricted",
    floatValue: transaction.floatValue === undefined || transaction.floatValue === null ? null : toNumber(transaction.floatValue),
    paymentMethod: transaction.paymentMethod || "Card",
    channel: transaction.channel || "CRM",
    date: transaction.date || nowIso(),
  };
}

export function normalizeBrowserDemoClient(client: BrowserDemoClientInput): BrowserDemoClient {
  const id = client.id || `demo-client-${crypto.randomUUID()}`;
  const transactions = (client.transactions || []).map((transaction) => normalizeTransaction(transaction, id));
  const updatedAt = client.updatedAt || client.lastSeenAt || client.createdAt || nowIso();

  return {
    id,
    name: String(client.name || "Yangi mijoz"),
    phone: toStringOrNull(client.phone),
    telegram: toStringOrNull(client.telegram),
    steamId: toStringOrNull(client.steamId),
    externalId: toStringOrNull(client.externalId),
    preferredCurrency: client.preferredCurrency || "USD",
    notes: toStringOrNull(client.notes),
    totalSpent: completedTotal(transactions),
    createdAt: client.createdAt || updatedAt,
    updatedAt,
    lastSeenAt: client.lastSeenAt || updatedAt,
    transactions,
  };
}

export function readBrowserDemoClients() {
  if (!isBrowser()) return [];

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];

    return parsed.map(normalizeBrowserDemoClient);
  } catch {
    return [];
  }
}

function writeBrowserDemoClients(clients: BrowserDemoClient[]) {
  if (!isBrowser()) return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(clients.map(normalizeBrowserDemoClient)));
  window.dispatchEvent(new Event(CHANGE_EVENT));
}

export function subscribeBrowserDemoStore(callback: () => void) {
  if (!isBrowser()) return () => {};

  const handler = () => callback();
  window.addEventListener(CHANGE_EVENT, handler);
  window.addEventListener("storage", handler);

  return () => {
    window.removeEventListener(CHANGE_EVENT, handler);
    window.removeEventListener("storage", handler);
  };
}

export function mergeBrowserDemoClients<T extends BrowserDemoClientInput>(serverClients: T[]) {
  const merged = new Map<string, BrowserDemoClient>();

  serverClients.forEach((client) => {
    if (client.id) {
      merged.set(client.id, normalizeBrowserDemoClient(client));
    }
  });

  readBrowserDemoClients().forEach((client) => {
    merged.set(client.id, client);
  });

  return Array.from(merged.values()).sort(
    (a, b) => new Date(b.updatedAt || b.createdAt).getTime() - new Date(a.updatedAt || a.createdAt).getTime(),
  );
}

export function getBrowserDemoClient(id: string) {
  return readBrowserDemoClients().find((client) => client.id === id) ?? null;
}

export function persistBrowserDemoClient(client: BrowserDemoClientInput) {
  const normalized = normalizeBrowserDemoClient(client);
  const nextClients = readBrowserDemoClients().filter((item) => item.id !== normalized.id);
  nextClients.unshift(normalized);
  writeBrowserDemoClients(nextClients);
  return normalized;
}

export function removeBrowserDemoClient(id: string) {
  writeBrowserDemoClients(readBrowserDemoClients().filter((client) => client.id !== id));
}

export function persistBrowserDemoTransaction(
  clientId: string,
  transaction: Partial<BrowserDemoTransaction>,
  fallbackClient?: BrowserDemoClientInput,
) {
  const existingClient = getBrowserDemoClient(clientId);
  if (!existingClient && !fallbackClient) return null;

  const baseClient = normalizeBrowserDemoClient(existingClient || { ...fallbackClient, id: clientId });
  const normalizedTransaction = normalizeTransaction(transaction, clientId);
  const transactions = [
    normalizedTransaction,
    ...baseClient.transactions.filter((item) => item.id !== normalizedTransaction.id),
  ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  return persistBrowserDemoClient({
    ...baseClient,
    transactions,
    updatedAt: nowIso(),
    lastSeenAt: nowIso(),
  });
}

export function removeBrowserDemoTransaction(transactionId: string) {
  const clients = readBrowserDemoClients();
  let changed = false;

  const nextClients = clients.map((client) => {
    const transactions = client.transactions.filter((transaction) => transaction.id !== transactionId);
    if (transactions.length === client.transactions.length) return client;

    changed = true;
    return normalizeBrowserDemoClient({
      ...client,
      transactions,
      updatedAt: nowIso(),
      lastSeenAt: nowIso(),
    });
  });

  if (changed) {
    writeBrowserDemoClients(nextClients);
  }
}

export function mergeBrowserDemoTrades<T extends Partial<TradeWithClient>>(serverTrades: T[]) {
  const merged = new Map<string, TradeWithClient>();

  serverTrades.forEach((trade) => {
    if (!trade.id || !trade.clientId || !trade.item) return;
    merged.set(trade.id, {
      ...normalizeTransaction(trade, trade.clientId),
      client: {
        id: trade.client?.id || trade.clientId,
        name: trade.client?.name || "Mijoz",
        telegram: trade.client?.telegram || null,
        phone: trade.client?.phone || null,
        steamId: trade.client?.steamId || null,
      },
    });
  });

  readBrowserDemoClients().forEach((client) => {
    client.transactions.forEach((transaction) => {
      merged.set(transaction.id, {
        ...transaction,
        client: {
          id: client.id,
          name: client.name,
          telegram: client.telegram,
          phone: client.phone,
          steamId: client.steamId || null,
        },
      });
    });
  });

  return Array.from(merged.values()).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}

import { randomUUID } from "crypto";
import { demoClients, type DemoClient, type DemoTransaction } from "@/lib/demo-data";

type DemoStoreState = {
  clients: DemoClient[];
};

type DemoStoreGlobal = typeof globalThis & {
  onepstoreDemoStore?: DemoStoreState;
};

type ClientCreateInput = {
  name: string;
  phone?: string | null;
  telegram?: string | null;
  steamId?: string | null;
  externalId?: string | null;
  notes?: string | null;
  item?: string;
  price?: string | number;
  buyPrice?: string | number;
  tradeId?: string | null;
  marginUsd?: string | number;
  floatValue?: string | number | null;
};

type TransactionCreateInput = {
  clientId: string;
  item: string;
  price: string | number;
  buyPrice: string | number;
  tradeId?: string | null;
  status?: string;
  floatValue?: string | number | null;
};

function cloneTransaction(transaction: DemoTransaction): DemoTransaction {
  return { ...transaction };
}

function cloneClient(client: DemoClient): DemoClient {
  return {
    ...client,
    transactions: client.transactions.map(cloneTransaction),
  };
}

function seedState(): DemoStoreState {
  return {
    clients: demoClients.map(cloneClient),
  };
}

function getState() {
  const storeGlobal = globalThis as DemoStoreGlobal;
  storeGlobal.onepstoreDemoStore ??= seedState();
  return storeGlobal.onepstoreDemoStore;
}

function nowIso() {
  return new Date().toISOString();
}

function newId(prefix: string) {
  return `${prefix}-${randomUUID()}`;
}

function toNullableString(value: unknown) {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function toFiniteNumber(value: string | number | null | undefined, fallback = 0) {
  const parsed = typeof value === "number" ? value : Number.parseFloat(value ?? "");
  return Number.isFinite(parsed) ? parsed : fallback;
}

function completedTotal(transactions: DemoTransaction[]) {
  return transactions
    .filter((transaction) => transaction.status === "COMPLETED")
    .reduce((sum, transaction) => sum + transaction.price, 0);
}

function withComputedClient(client: DemoClient) {
  const cloned = cloneClient(client);
  cloned.transactions.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  cloned.totalSpent = completedTotal(cloned.transactions);
  return cloned;
}

export function listDemoStoreClients() {
  return getState()
    .clients.map(withComputedClient)
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
}

export function listDemoStoreTransactions() {
  return getState()
    .clients.flatMap((client) =>
      client.transactions.map((transaction) => ({
        ...cloneTransaction(transaction),
        client: {
          id: client.id,
          name: client.name,
          telegram: client.telegram,
          phone: client.phone,
          steamId: client.steamId,
        },
      })),
    )
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}

export function getDemoStoreClient(id: string) {
  const client = getState().clients.find((item) => item.id === id);
  return client ? withComputedClient(client) : null;
}

export function createDemoStoreClient(input: ClientCreateInput) {
  const state = getState();
  const createdAt = nowIso();
  const clientId = newId("demo-client");
  const price = toFiniteNumber(input.price);
  const buyPrice = toFiniteNumber(input.buyPrice);
  const hasInitialTrade = Boolean(input.item || input.price);

  const transactions: DemoTransaction[] = hasInitialTrade
    ? [
        {
          id: newId("demo-tx"),
          clientId,
          tradeId: toNullableString(input.tradeId),
          item: String(input.item ?? "Skin"),
          price,
          marginUsd: input.marginUsd === undefined ? price - buyPrice : toFiniteNumber(input.marginUsd),
          status: "COMPLETED",
          rarity: "Restricted",
          floatValue: input.floatValue === undefined || input.floatValue === null ? null : toFiniteNumber(input.floatValue),
          paymentMethod: "Card",
          channel: "CRM",
          date: createdAt,
        },
      ]
    : [];

  const client: DemoClient = {
    id: clientId,
    name: input.name.trim(),
    phone: toNullableString(input.phone),
    telegram: toNullableString(input.telegram),
    steamId: toNullableString(input.steamId),
    externalId: toNullableString(input.externalId),
    preferredCurrency: "USD",
    notes: toNullableString(input.notes),
    totalSpent: completedTotal(transactions),
    createdAt,
    updatedAt: createdAt,
    lastSeenAt: createdAt,
    transactions,
  };

  state.clients.unshift(client);
  return withComputedClient(client);
}

export function updateDemoStoreClient(id: string, input: Partial<DemoClient>) {
  const state = getState();
  const client = state.clients.find((item) => item.id === id);
  if (!client) return null;

  client.name = typeof input.name === "string" && input.name.trim() ? input.name.trim() : client.name;
  client.phone = input.phone === undefined ? client.phone : toNullableString(input.phone);
  client.telegram = input.telegram === undefined ? client.telegram : toNullableString(input.telegram);
  client.steamId = input.steamId === undefined ? client.steamId : toNullableString(input.steamId);
  client.externalId = input.externalId === undefined ? client.externalId : toNullableString(input.externalId);
  client.notes = input.notes === undefined ? client.notes : toNullableString(input.notes);
  client.updatedAt = nowIso();

  return withComputedClient(client);
}

export function deleteDemoStoreClient(id: string) {
  const state = getState();
  const nextClients = state.clients.filter((client) => client.id !== id);
  const deleted = nextClients.length !== state.clients.length;
  state.clients = nextClients;
  return deleted;
}

export function createDemoStoreTransaction(input: TransactionCreateInput) {
  const client = getState().clients.find((item) => item.id === input.clientId);
  if (!client) return null;

  const price = toFiniteNumber(input.price);
  const buyPrice = toFiniteNumber(input.buyPrice);
  const date = nowIso();
  const transaction: DemoTransaction = {
    id: newId("demo-tx"),
    clientId: input.clientId,
    tradeId: toNullableString(input.tradeId),
    item: input.item.trim(),
    price,
    marginUsd: price - buyPrice,
    status: input.status || "COMPLETED",
    rarity: "Restricted",
    floatValue: input.floatValue === undefined || input.floatValue === null ? null : toFiniteNumber(input.floatValue),
    paymentMethod: "Card",
    channel: "CRM",
    date,
  };

  client.transactions.unshift(transaction);
  client.totalSpent = completedTotal(client.transactions);
  client.lastSeenAt = date;
  client.updatedAt = date;

  return cloneTransaction(transaction);
}

export function deleteDemoStoreTransaction(id: string) {
  const state = getState();

  for (const client of state.clients) {
    const nextTransactions = client.transactions.filter((transaction) => transaction.id !== id);
    if (nextTransactions.length !== client.transactions.length) {
      const updatedAt = nowIso();
      client.transactions = nextTransactions;
      client.totalSpent = completedTotal(client.transactions);
      client.lastSeenAt = updatedAt;
      client.updatedAt = updatedAt;
      return true;
    }
  }

  return false;
}

export type DemoTransaction = {
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

export type DemoClient = {
  id: string;
  name: string;
  phone: string | null;
  telegram: string | null;
  steamId: string | null;
  externalId: string | null;
  preferredCurrency: string;
  notes: string | null;
  totalSpent: number;
  createdAt: string;
  updatedAt: string;
  lastSeenAt: string | null;
  transactions: DemoTransaction[];
};

const baseDate = "2026-07-02T09:30:00.000Z";

export const demoClients: DemoClient[] = [
  {
    id: "demo-s1mple",
    name: "S1mple",
    phone: "+998 90 123 45 67",
    telegram: "@s1mple_cs2",
    steamId: "STEAM_1:0:7999999",
    externalId: "CRM-001",
    preferredCurrency: "USD",
    notes: "High-value collector. Prefers AWP and knife skins.",
    totalSpent: 18150,
    createdAt: "2026-06-18T08:20:00.000Z",
    updatedAt: baseDate,
    lastSeenAt: baseDate,
    transactions: [
      {
        id: "demo-tx-001",
        clientId: "demo-s1mple",
        tradeId: "TRD-8801",
        item: "AWP | Dragon Lore",
        price: 12500,
        marginUsd: 1800,
        status: "COMPLETED",
        rarity: "Covert",
        floatValue: 0.021,
        paymentMethod: "USDT TRC20",
        channel: "Telegram",
        date: "2026-07-02T08:40:00.000Z",
      },
      {
        id: "demo-tx-002",
        clientId: "demo-s1mple",
        tradeId: "TRD-8734",
        item: "Karambit | Doppler Sapphire",
        price: 5650,
        marginUsd: 720,
        status: "COMPLETED",
        rarity: "Covert",
        floatValue: 0.009,
        paymentMethod: "Card",
        channel: "Store",
        date: "2026-06-29T13:15:00.000Z",
      },
    ],
  },
  {
    id: "demo-zywoo",
    name: "ZywOo",
    phone: "+998 91 777 66 55",
    telegram: "@zywoo_god",
    steamId: "STEAM_1:1:7000001",
    externalId: "CRM-002",
    preferredCurrency: "USD",
    notes: "Usually buys classified rifles and gloves.",
    totalSpent: 7925,
    createdAt: "2026-06-20T11:05:00.000Z",
    updatedAt: "2026-07-01T17:10:00.000Z",
    lastSeenAt: "2026-07-01T17:10:00.000Z",
    transactions: [
      {
        id: "demo-tx-003",
        clientId: "demo-zywoo",
        tradeId: "TRD-8814",
        item: "Sport Gloves | Pandora's Box",
        price: 5000,
        marginUsd: 640,
        status: "ESCROW",
        rarity: "Covert",
        floatValue: 0.19,
        paymentMethod: "USDT TRC20",
        channel: "Telegram",
        date: "2026-07-01T17:10:00.000Z",
      },
      {
        id: "demo-tx-004",
        clientId: "demo-zywoo",
        tradeId: "TRD-8662",
        item: "AK-47 | Redline",
        price: 2925,
        marginUsd: 410,
        status: "COMPLETED",
        rarity: "Classified",
        floatValue: 0.12,
        paymentMethod: "Card",
        channel: "Website",
        date: "2026-06-26T10:45:00.000Z",
      },
    ],
  },
  {
    id: "demo-niko",
    name: "NiKo",
    phone: null,
    telegram: "@niko_g2",
    steamId: "STEAM_1:0:7000002",
    externalId: "CRM-003",
    preferredCurrency: "USD",
    notes: "New customer. Keep under manual review until second payout clears.",
    totalSpent: 2870,
    createdAt: "2026-06-24T09:35:00.000Z",
    updatedAt: "2026-06-30T14:25:00.000Z",
    lastSeenAt: "2026-06-30T14:25:00.000Z",
    transactions: [
      {
        id: "demo-tx-005",
        clientId: "demo-niko",
        tradeId: "TRD-8777",
        item: "M4A4 | Howl",
        price: 2870,
        marginUsd: 350,
        status: "PENDING",
        rarity: "Contraband",
        floatValue: 0.07,
        paymentMethod: "Cash",
        channel: "Store",
        date: "2026-06-30T14:25:00.000Z",
      },
    ],
  },
  {
    id: "demo-monesy",
    name: "m0NESY",
    phone: "+998 93 444 22 11",
    telegram: "@m0nesy_sniper",
    steamId: "STEAM_1:1:7000003",
    externalId: "CRM-004",
    preferredCurrency: "USD",
    notes: "Fast repeat buyer, prefers Telegram confirmations.",
    totalSpent: 4300,
    createdAt: "2026-06-21T12:00:00.000Z",
    updatedAt: "2026-06-28T16:50:00.000Z",
    lastSeenAt: "2026-06-28T16:50:00.000Z",
    transactions: [
      {
        id: "demo-tx-006",
        clientId: "demo-monesy",
        tradeId: "TRD-8699",
        item: "Butterfly Knife | Fade",
        price: 4300,
        marginUsd: 515,
        status: "COMPLETED",
        rarity: "Covert",
        floatValue: 0.034,
        paymentMethod: "USDT TRC20",
        channel: "Telegram",
        date: "2026-06-28T16:50:00.000Z",
      },
    ],
  },
];

export const demoTrades = demoClients
  .flatMap((client) =>
    client.transactions.map((transaction) => ({
      ...transaction,
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

export function getDemoClient(id: string) {
  return demoClients.find((client) => client.id === id) ?? null;
}

export function dashboardTotals(trades: Array<{ status: string; price: number; marginUsd: number }> = demoTrades) {
  const completedTrades = trades.filter((trade) => trade.status === "COMPLETED");
  const revenue = completedTrades.reduce((sum, trade) => sum + trade.price, 0);
  const margin = completedTrades.reduce((sum, trade) => sum + trade.marginUsd, 0);
  const completed = completedTrades.length;
  const escrow = trades.filter((trade) => trade.status === "ESCROW" || trade.status === "PENDING").length;
  const disputed = trades.filter((trade) => trade.status === "DISPUTED").length;

  return {
    revenue,
    margin,
    completed,
    escrow,
    disputed,
    averageOrder: completed > 0 ? revenue / completed : 0,
  };
}

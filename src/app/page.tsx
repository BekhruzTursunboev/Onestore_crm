import DashboardCommandCenter from "@/components/DashboardCommandCenter";
import { dashboardTotals, demoClients, demoTrades } from "@/lib/demo-data";
import { listDemoStoreClients, listDemoStoreTransactions } from "@/lib/demo-store";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

function serializeDate(date: Date | null | undefined) {
  return date ? date.toISOString() : null;
}

type DashboardClient = {
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
  transactions: Array<{
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
  }>;
};

type DashboardTrade = DashboardClient["transactions"][number] & {
  client: {
    id: string;
    name: string;
    telegram: string | null;
    phone: string | null;
    steamId: string | null;
  };
};

function stripDashboardClientFields(client: (typeof demoClients)[number]): DashboardClient {
  return {
    id: client.id,
    name: client.name,
    phone: client.phone,
    telegram: client.telegram,
    steamId: client.steamId,
    externalId: client.externalId,
    notes: client.notes,
    totalSpent: client.totalSpent,
    createdAt: client.createdAt,
    updatedAt: client.updatedAt,
    lastSeenAt: client.lastSeenAt,
    transactions: client.transactions,
  };
}

function stripDashboardTradeFields(trade: (typeof demoTrades)[number]): DashboardTrade {
  return {
    ...trade,
    client: {
      id: trade.client.id,
      name: trade.client.name,
      telegram: trade.client.telegram,
      phone: trade.client.phone,
      steamId: trade.client.steamId,
    },
  };
}

export default async function Dashboard() {
  let serializedClients: DashboardClient[] = demoClients.map(stripDashboardClientFields);
  let serializedTrades: DashboardTrade[] = demoTrades.map(stripDashboardTradeFields);

  try {
    const [clients, trades] = await Promise.all([
      prisma.client.findMany({
        orderBy: { updatedAt: "desc" },
        include: {
          transactions: {
            orderBy: { date: "desc" },
          },
        },
      }),
      prisma.transaction.findMany({
        orderBy: { date: "desc" },
        take: 80,
        include: {
          client: true,
        },
      }),
    ]);

    serializedClients = clients.map((client) => {
      const completed = client.transactions.filter((trade) => trade.status === "COMPLETED");
      const totalSpent = completed.reduce((sum, trade) => sum + trade.price, 0);

      return {
        ...client,
        createdAt: serializeDate(client.createdAt)!,
        updatedAt: serializeDate(client.updatedAt)!,
        lastSeenAt: serializeDate(client.lastSeenAt),
        totalSpent,
        transactions: client.transactions.map((trade) => ({
          ...trade,
          date: serializeDate(trade.date)!,
        })),
      };
    });

    serializedTrades = trades.map((trade) => ({
      ...trade,
      date: serializeDate(trade.date)!,
      client: {
        id: trade.client.id,
        name: trade.client.name,
        telegram: trade.client.telegram,
        phone: trade.client.phone,
        steamId: trade.client.steamId,
      },
    }));
  } catch (error) {
    console.error("Dashboard database unavailable, rendering demo data:", error);
    serializedClients = listDemoStoreClients().map(stripDashboardClientFields);
    serializedTrades = listDemoStoreTransactions().map(stripDashboardTradeFields);
  }

  return (
    <DashboardCommandCenter
      clients={serializedClients}
      trades={serializedTrades}
      generatedAtLabel={new Intl.DateTimeFormat("uz-Latn-UZ", {
        hour: "2-digit",
        minute: "2-digit",
        timeZone: "Asia/Tashkent",
      }).format(new Date())}
      totals={dashboardTotals(serializedTrades)}
    />
  );
}

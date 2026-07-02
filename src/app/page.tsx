import DashboardCommandCenter from "@/components/DashboardCommandCenter";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

function serializeDate(date: Date | null | undefined) {
  return date ? date.toISOString() : null;
}

export default async function Dashboard() {
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

  const serializedClients = clients.map((client) => {
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

  const serializedTrades = trades.map((trade) => ({
    ...trade,
    date: serializeDate(trade.date)!,
    client: {
      id: trade.client.id,
      name: trade.client.name,
      telegram: trade.client.telegram,
      phone: trade.client.phone,
      steamId: trade.client.steamId,
      verificationStatus: trade.client.verificationStatus,
      marketTier: trade.client.marketTier,
    },
  }));

  const completedTrades = trades.filter((trade) => trade.status === "COMPLETED");
  const revenue = completedTrades.reduce((sum, trade) => sum + trade.price, 0);
  const margin = completedTrades.reduce((sum, trade) => sum + trade.marginUsd, 0);
  const completed = completedTrades.length;
  const escrow = trades.filter((trade) => trade.status === "ESCROW" || trade.status === "PENDING").length;
  const disputed = trades.filter((trade) => trade.status === "DISPUTED").length;

  return (
    <DashboardCommandCenter
      clients={serializedClients}
      trades={serializedTrades}
      generatedAtLabel={new Intl.DateTimeFormat("uz-Latn-UZ", {
        hour: "2-digit",
        minute: "2-digit",
        timeZone: "Asia/Tashkent",
      }).format(new Date())}
      totals={{
        revenue,
        margin,
        completed,
        escrow,
        disputed,
        averageOrder: completed > 0 ? revenue / completed : 0,
      }}
    />
  );
}

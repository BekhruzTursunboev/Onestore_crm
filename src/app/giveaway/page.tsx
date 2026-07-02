import GiveawayRandomizer from "./GiveawayRandomizer";
import { demoClients } from "@/lib/demo-data";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function GiveawayPage() {
  let serializedClients = demoClients.map((client) => ({
    id: client.id,
    name: client.name,
    phone: client.phone,
    telegram: client.telegram,
    totalSpent: client.totalSpent,
    transactions: client.transactions.map(({ id, price, item, status }) => ({ id, price, item, status })),
  }));

  try {
    const clients = await prisma.client.findMany({
      orderBy: [{ totalSpent: "desc" }, { updatedAt: "desc" }],
      include: {
        transactions: {
          orderBy: { date: "desc" },
          select: {
            id: true,
            price: true,
            item: true,
            status: true,
          },
        },
      },
    });

    serializedClients = clients.map((client) => {
      const completed = client.transactions.filter((trade) => trade.status === "COMPLETED");
      const totalSpent = completed.reduce((sum, trade) => sum + trade.price, 0);

      return {
        id: client.id,
        name: client.name,
        phone: client.phone,
        telegram: client.telegram,
        totalSpent,
        transactions: client.transactions,
      };
    });
  } catch (error) {
    console.error("Giveaway database unavailable, rendering demo data:", error);
  }

  return <GiveawayRandomizer clients={serializedClients} />;
}

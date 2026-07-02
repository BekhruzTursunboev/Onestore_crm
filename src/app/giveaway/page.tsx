import GiveawayRandomizer from "./GiveawayRandomizer";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function GiveawayPage() {
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

  const serializedClients = clients.map((client) => {
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

  return <GiveawayRandomizer clients={serializedClients} />;
}

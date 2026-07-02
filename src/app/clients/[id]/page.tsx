import { notFound } from 'next/navigation';
import ClientDetailView from './ClientDetailView';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export default async function ClientDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const client = await prisma.client.findUnique({
    where: { id },
    include: {
      transactions: {
        orderBy: { date: 'desc' },
      },
    },
  });

  if (!client) {
    notFound();
  }

  const totalSpent = client.transactions
    .filter((transaction) => transaction.status === 'COMPLETED')
    .reduce((sum, transaction) => sum + transaction.price, 0);

  return (
    <ClientDetailView
      clientId={id}
      initialClient={{
        ...client,
        totalSpent,
        createdAt: client.createdAt.toISOString(),
        transactions: client.transactions.map((transaction) => ({
          ...transaction,
          date: transaction.date.toISOString(),
        })),
      }}
    />
  );
}

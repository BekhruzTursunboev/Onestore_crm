import { notFound } from 'next/navigation';
import ClientDetailView from './ClientDetailView';
import { getDemoStoreClient } from '@/lib/demo-store';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export default async function ClientDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  type ClientDetailProps = Parameters<typeof ClientDetailView>[0];
  let initialClient: ClientDetailProps['initialClient'] | null = null;

  try {
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

    initialClient = {
      ...client,
      totalSpent,
      createdAt: client.createdAt.toISOString(),
      transactions: client.transactions.map((transaction) => ({
        ...transaction,
        date: transaction.date.toISOString(),
      })),
    };
  } catch (error) {
    console.error('Client detail database unavailable, rendering demo data:', error);
    initialClient = getDemoStoreClient(id);
  }

  if (!initialClient) {
    if (!id.startsWith('demo-client-')) {
      notFound();
    }

    const createdAt = new Date().toISOString();
    initialClient = {
      id,
      name: 'Mijoz yuklanmoqda',
      phone: null,
      telegram: null,
      totalSpent: 0,
      createdAt,
      transactions: [],
    };
  }

  return <ClientDetailView clientId={id} initialClient={initialClient} />;
}

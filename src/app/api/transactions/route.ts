import { NextResponse } from 'next/server';
import {
  createDemoStoreTransaction,
  deleteDemoStoreTransaction,
  listDemoStoreTransactions,
} from '@/lib/demo-store';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const transactions = await prisma.transaction.findMany({
      orderBy: { date: 'desc' },
      include: {
        client: {
          select: { name: true, telegram: true, steamId: true }
        }
      },
      take: 80,
    });
    return NextResponse.json(transactions);
  } catch (error) {
    console.error('Savdolarni yuklash xatosi:', error);
    return NextResponse.json(listDemoStoreTransactions());
  }
}

export async function POST(request: Request) {
  let body: Record<string, string | number | null | undefined>;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "So'rov ma'lumoti noto'g'ri" }, { status: 400 });
  }

  const {
    clientId,
    item,
    price, // Sell Price
    buyPrice, // Buy Price
    tradeId,
    status, // COMPLETED, ESCROW, PENDING, DISPUTED, CANCELLED
    floatValue,
  } = body;

  if (!clientId || !item || price === undefined || buyPrice === undefined) {
    return NextResponse.json({ error: 'Mijoz, skin nomi, sotib olingan va sotilgan narxlar majburiy' }, { status: 400 });
  }

  const priceFloat = parseFloat(String(price));
  const buyPriceFloat = parseFloat(String(buyPrice));
  if (!Number.isFinite(priceFloat) || priceFloat < 0 || !Number.isFinite(buyPriceFloat) || buyPriceFloat < 0) {
    return NextResponse.json({ error: 'Narxlar to\'g\'ri kiritilishi kerak' }, { status: 400 });
  }

  const marginUsd = priceFloat - buyPriceFloat;
  const clientIdString = String(clientId);

  try {
    const transaction = await prisma.transaction.create({
      data: {
        clientId: clientIdString,
        item: String(item),
        price: priceFloat,
        marginUsd,
        tradeId: tradeId ? String(tradeId) : null,
        status: status ? String(status) : 'COMPLETED',
        rarity: 'Restricted',
        paymentMethod: 'Card',
        channel: 'CRM',
        floatValue: floatValue ? parseFloat(String(floatValue)) : null,
      },
    });

    // Update client totalSpent
    const completedTransactions = await prisma.transaction.findMany({
      where: { clientId: clientIdString, status: 'COMPLETED' },
      select: { price: true },
    });
    const totalSpent = completedTransactions.reduce((sum, tx) => sum + tx.price, 0);

    await prisma.client.update({
      where: { id: clientIdString },
      data: {
        totalSpent,
        lastSeenAt: new Date(),
      },
    });

    return NextResponse.json(transaction, { status: 201 });
  } catch (error) {
    console.error('Savdo yaratish xatosi:', error);
    const fallbackTransaction = createDemoStoreTransaction({
      ...body,
      clientId: clientIdString,
      item: String(item),
      price: priceFloat,
      buyPrice: buyPriceFloat,
      status: status ? String(status) : undefined,
    });

    if (!fallbackTransaction) {
      return NextResponse.json({ error: 'Mijoz topilmadi' }, { status: 404 });
    }

    return NextResponse.json(fallbackTransaction, { status: 201 });
  }
}

export async function DELETE(request: Request) {
  let id: string | undefined;

  try {
    const body = await request.json();
    id = typeof body.id === 'string' ? body.id : undefined;
    if (!id) {
      return NextResponse.json({ error: 'Tranzaksiya ID majburiy' }, { status: 400 });
    }

    const transaction = await prisma.transaction.findUnique({
      where: { id },
      select: { clientId: true },
    });

    if (!transaction) {
      return NextResponse.json({ error: 'Tranzaksiya topilmadi' }, { status: 404 });
    }

    const { clientId } = transaction;

    await prisma.transaction.delete({
      where: { id },
    });

    // Recalculate client totalSpent
    const completedTransactions = await prisma.transaction.findMany({
      where: { clientId, status: 'COMPLETED' },
      select: { price: true },
    });
    const totalSpent = completedTransactions.reduce((sum, tx) => sum + tx.price, 0);

    await prisma.client.update({
      where: { id: clientId },
      data: {
        totalSpent,
        lastSeenAt: new Date(),
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Savdo o\'chirish xatosi:', error);
    if (id && (deleteDemoStoreTransaction(id) || id.startsWith('demo-tx-'))) {
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: "Tranzaksiya topilmadi" }, { status: 404 });
  }
}

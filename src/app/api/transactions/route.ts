import { NextResponse } from 'next/server';
import { demoTrades } from '@/lib/demo-data';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const transactions = await prisma.transaction.findMany({
      orderBy: { date: 'desc' },
      include: {
        client: {
          select: { name: true, telegram: true, steamId: true, verificationStatus: true }
        }
      },
      take: 80,
    });
    return NextResponse.json(transactions);
  } catch (error) {
    console.error('Savdolarni yuklash xatosi:', error);
    return NextResponse.json(demoTrades);
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      clientId,
      item,
      price, // Sell Price
      buyPrice, // Buy Price
      tradeId,
      status, // COMPLETED, ESCROW, PENDING, DISPUTED, CANCELLED
      rarity,
      paymentMethod,
      channel,
      floatValue,
    } = body;

    if (!clientId || !item || price === undefined || buyPrice === undefined) {
      return NextResponse.json({ error: 'Mijoz, skin nomi, sotib olingan va sotilgan narxlar majburiy' }, { status: 400 });
    }

    const priceFloat = parseFloat(price);
    const buyPriceFloat = parseFloat(buyPrice);
    if (!Number.isFinite(priceFloat) || priceFloat < 0 || !Number.isFinite(buyPriceFloat) || buyPriceFloat < 0) {
      return NextResponse.json({ error: 'Narxlar to\'g\'ri kiritilishi kerak' }, { status: 400 });
    }

    const marginUsd = priceFloat - buyPriceFloat;

    const transaction = await prisma.transaction.create({
      data: {
        clientId,
        item,
        price: priceFloat,
        marginUsd,
        tradeId: tradeId || null,
        status: status || 'COMPLETED',
        rarity: rarity || 'Restricted',
        paymentMethod: paymentMethod || 'Card',
        channel: channel || 'Telegram',
        floatValue: floatValue ? parseFloat(floatValue) : null,
      },
    });

    // Update client totalSpent
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

    return NextResponse.json(transaction, { status: 201 });
  } catch (error) {
    console.error('Savdo yaratish xatosi:', error);
    return NextResponse.json(
      { error: "Online demo ma'lumotlar bazasi sozlanmagan. Postgres DATABASE_URL qo'shing." },
      { status: 503 },
    );
  }
}

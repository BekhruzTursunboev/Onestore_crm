import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const clients = await prisma.client.findMany({
      orderBy: { updatedAt: 'desc' },
      include: {
        transactions: {
          orderBy: { date: 'desc' },
        },
      },
    });

    const enrichedClients = clients.map((client) => {
      const completed = client.transactions.filter((tx) => tx.status === 'COMPLETED');
      const totalSpent = completed.reduce((sum, tx) => sum + tx.price, 0);
      const lastTrade = client.transactions[0]?.date ?? client.lastSeenAt ?? client.updatedAt;

      return {
        ...client,
        totalSpent,
        lastTrade,
        transactions: client.transactions,
      };
    });

    return NextResponse.json(enrichedClients);
  } catch (error) {
    console.error('Mijozlarni yuklash xatosi:', error);
    return NextResponse.json({ error: "Mijozlarni yuklab bo'lmadi" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      name,
      phone,
      telegram,
      steamId,
      externalId,
      marketTier,
      verificationStatus,
      notes,
      item,
      price,
      buyPrice,
      rarity,
      tradeId,
      paymentMethod,
      channel,
      marginUsd,
      floatValue,
    } = body;

    if (!name) {
      return NextResponse.json({ error: 'Mijoz ismi majburiy' }, { status: 400 });
    }

    const hasInitialTrade = Boolean(item || price);
    const priceFloat = hasInitialTrade ? parseFloat(price) : 0;
    const buyPriceFloat = hasInitialTrade && buyPrice ? parseFloat(buyPrice) : 0;

    if (hasInitialTrade && (!item || price === undefined || !Number.isFinite(priceFloat) || priceFloat < 0)) {
      return NextResponse.json({ error: "Skin va narx to'g'ri kiritilishi kerak" }, { status: 400 });
    }

    const client = await prisma.client.create({
      data: {
        name,
        phone: phone || null,
        telegram: telegram || null,
        steamId: steamId || null,
        externalId: externalId || null,
        marketTier: marketTier || 'Retail',
        verificationStatus: verificationStatus || 'WATCH',
        notes: notes || null,
        totalSpent: priceFloat,
        lastSeenAt: new Date(),
        ...(hasInitialTrade
          ? {
              transactions: {
                create: {
                  item,
                  price: priceFloat,
                  tradeId: tradeId || null,
                  status: 'COMPLETED',
                  rarity: rarity || 'Restricted',
                  paymentMethod: paymentMethod || 'Card',
                  channel: channel || 'Telegram',
                  marginUsd: marginUsd ? parseFloat(marginUsd) : (priceFloat - buyPriceFloat),
                  floatValue: floatValue ? parseFloat(floatValue) : null,
                },
              },
            }
          : {}),
      },
      include: {
        transactions: true,
      },
    });

    return NextResponse.json(client, { status: 201 });
  } catch (error) {
    console.error('Mijoz yaratish xatosi:', error);
    return NextResponse.json({ error: "Mijozni yaratib bo'lmadi" }, { status: 500 });
  }
}

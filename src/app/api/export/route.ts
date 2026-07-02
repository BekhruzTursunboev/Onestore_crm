import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET() {
  try {
    const transactions = await prisma.transaction.findMany({
      include: {
        client: {
          select: {
            name: true,
            steamId: true,
            telegram: true,
            phone: true,
          },
        },
      },
      orderBy: {
        date: 'desc',
      },
    });

    const headers = [
      'savdo_id',
      'mijoz',
      'steam_id',
      'telegram',
      'telefon',
      'skin',
      'summa_usd',
      'holat',
      'sana',
    ];

    if (!transactions || transactions.length === 0) {
      return new NextResponse(`${headers.join(',')}\n`, {
        status: 200,
        headers: {
          'Content-Type': 'text/csv; charset=utf-8',
          'Content-Disposition': 'attachment; filename="savdolar.csv"',
        },
      });
    }

    const rows = transactions.map((tx) =>
      [
        tx.id,
        tx.client?.name,
        tx.client?.steamId,
        tx.client?.telegram,
        tx.client?.phone,
        tx.item,
        tx.price,
        tx.status,
        tx.date.toISOString(),
      ]
        .map((val) => {
          if (val === null || val === undefined) return '';
          const str = String(val);
          if (str.includes(',') || str.includes('"') || str.includes('\n')) {
            return `"${str.replace(/"/g, '""')}"`;
          }
          return str;
        })
        .join(',')
    );

    const csvContent = [headers.join(','), ...rows].join('\n');

    return new NextResponse(csvContent, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': 'attachment; filename="savdolar.csv"',
      },
    });
  } catch (error) {
    console.error('Savdolarni eksport qilish xatosi:', error);
    return NextResponse.json({ error: 'Ichki server xatosi' }, { status: 500 });
  }
}

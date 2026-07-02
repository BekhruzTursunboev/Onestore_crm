import { NextResponse } from 'next/server';
import { demoTrades } from '@/lib/demo-data';
import { prisma } from '@/lib/prisma';

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

function csvResponse(rows: string[]) {
  const csvContent = [headers.join(','), ...rows].join('\n');

  return new NextResponse(`${csvContent}\n`, {
    status: 200,
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': 'attachment; filename="savdolar.csv"',
    },
  });
}

function escapeCsvValue(value: unknown) {
  if (value === null || value === undefined) return '';
  const str = String(value);
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

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

    if (!transactions || transactions.length === 0) {
      return csvResponse([]);
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
        .map(escapeCsvValue)
        .join(',')
    );

    return csvResponse(rows);
  } catch (error) {
    console.error('Savdolarni eksport qilish xatosi:', error);
    const rows = demoTrades.map((tx) =>
      [
        tx.id,
        tx.client.name,
        tx.client.steamId,
        tx.client.telegram,
        tx.client.phone,
        tx.item,
        tx.price,
        tx.status,
        tx.date,
      ]
        .map(escapeCsvValue)
        .join(',')
    );

    return csvResponse(rows);
  }
}

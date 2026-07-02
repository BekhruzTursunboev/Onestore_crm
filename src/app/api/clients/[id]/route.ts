import { NextResponse } from 'next/server';
import { getDemoClient } from '@/lib/demo-data';
import { prisma } from '@/lib/prisma';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    const client = await prisma.client.findUnique({
      where: { id },
      include: {
        transactions: true,
      },
    });

    if (!client) {
      return NextResponse.json({ error: 'Mijoz topilmadi' }, { status: 404 });
    }

    const spent = client.transactions
      .filter(t => t.status === 'COMPLETED')
      .reduce((sum, tx) => sum + tx.price, 0);
      
    const clientWithComputedSpent = { ...client, totalSpent: spent };

    return NextResponse.json(clientWithComputedSpent);
  } catch (error) {
    console.error('Mijozni yuklash xatosi:', error);
    const demoClient = getDemoClient(id);
    if (demoClient) {
      return NextResponse.json(demoClient);
    }
    return NextResponse.json({ error: "Mijozni yuklab bo'lmadi" }, { status: 500 });
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const client = await prisma.client.update({
      where: { id },
      data: body,
    });

    return NextResponse.json(client);
  } catch (error) {
    console.error('Mijozni yangilash xatosi:', error);
    return NextResponse.json({ error: "Mijozni yangilab bo'lmadi" }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await prisma.client.delete({
      where: { id },
    });

    return NextResponse.json({ message: "Mijoz muvaffaqiyatli o'chirildi" });
  } catch (error) {
    console.error("Mijozni o'chirish xatosi:", error);
    return NextResponse.json({ error: "Mijozni o'chirib bo'lmadi" }, { status: 500 });
  }
}

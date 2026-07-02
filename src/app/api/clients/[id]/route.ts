import { NextResponse } from 'next/server';
import { deleteDemoStoreClient, getDemoStoreClient, updateDemoStoreClient } from '@/lib/demo-store';
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
    const demoClient = getDemoStoreClient(id);
    if (demoClient) {
      return NextResponse.json(demoClient);
    }
    return NextResponse.json({ error: 'Mijoz topilmadi' }, { status: 404 });
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  let body: Record<string, string | null | undefined>;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "So'rov ma'lumoti noto'g'ri" }, { status: 400 });
  }

  try {
    const client = await prisma.client.update({
      where: { id },
      data: body,
    });

    return NextResponse.json(client);
  } catch (error) {
    console.error('Mijozni yangilash xatosi:', error);
    const fallbackClient = updateDemoStoreClient(id, body);
    if (!fallbackClient) {
      return NextResponse.json({ error: 'Mijoz topilmadi' }, { status: 404 });
    }

    return NextResponse.json(fallbackClient);
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // First delete client's transactions to maintain database integrity
    await prisma.transaction.deleteMany({
      where: { clientId: id },
    });

    await prisma.client.delete({
      where: { id },
    });

    return NextResponse.json({ message: "Mijoz muvaffaqiyatli o'chirildi" });
  } catch (error) {
    console.error("Mijozni o'chirish xatosi:", error);
    const { id } = await params;

    if (deleteDemoStoreClient(id)) {
      return NextResponse.json({ message: "Mijoz muvaffaqiyatli o'chirildi" });
    }

    return NextResponse.json({ error: 'Mijoz topilmadi' }, { status: 404 });
  }
}

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // Clear existing data
  await prisma.transaction.deleteMany();
  await prisma.client.deleteMany();

  console.log('Database cleared. Seeding new data...');

  const clients = [
    { name: 'S1mple', phone: '+998901234567', telegram: '@s1mple_cs2' },
    { name: 'ZywOo', phone: '+998901234568', telegram: '@zywoo_god' },
    { name: 'NiKo', phone: '+998901234569', telegram: '@niko_g2' },
    { name: 'm0NESY', phone: '+998901234570', telegram: '@m0nesy_sniper' },
    { name: 'donk', phone: '+998901234571', telegram: '@donk_spirit' },
  ];

  for (const c of clients) {
    const createdClient = await prisma.client.create({
      data: c,
    });
    
    // Create an initial transaction for them
    await prisma.transaction.create({
      data: {
        clientId: createdClient.id,
        item: 'AWP | Dragon Lore (Factory New)',
        price: 12500.00,
        status: 'COMPLETED',
        rarity: 'Covert'
      }
    });

    // Update their totalSpent dynamically
    await prisma.client.update({
      where: { id: createdClient.id },
      data: { totalSpent: 12500.00 }
    });
  }

  console.log('Seed completed successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

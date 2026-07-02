import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const fakeItems = [
  { item: 'AWP | Dragon Lore', rarity: 'Covert', price: 10500.0 },
  { item: 'AK-47 | Redline', rarity: 'Classified', price: 25.5 },
  { item: 'M4A4 | Howl', rarity: 'Contraband', price: 6500.0 },
  { item: 'Glock-18 | Fade', rarity: 'Restricted', price: 1200.0 },
  { item: 'Desert Eagle | Blaze', rarity: 'Restricted', price: 450.0 },
  { item: 'USP-S | Kill Confirmed', rarity: 'Covert', price: 150.0 },
  { item: 'Karambit | Doppler (Sapphire)', rarity: 'Covert', price: 8000.0 },
  { item: 'Butterfly Knife | Fade', rarity: 'Covert', price: 3500.0 },
  { item: 'M9 Bayonet | Crimson Web', rarity: 'Covert', price: 2000.0 },
  { item: 'Sport Gloves | Pandora\'s Box', rarity: 'Covert', price: 5000.0 }
];

async function main() {
  const clients = await prisma.client.findMany();
  
  if (clients.length === 0) {
    console.log('No clients found. Please run the initial seed first.');
    return;
  }

  for (let i = 0; i < 10; i++) {
    const randomClient = clients[Math.floor(Math.random() * clients.length)];
    const itemData = fakeItems[i];
    
    await prisma.transaction.create({
      data: {
        clientId: randomClient.id,
        item: itemData.item,
        price: itemData.price,
        rarity: itemData.rarity,
        status: 'COMPLETED',
      }
    });
  }
  
  console.log('Successfully pushed 10 new fake CS2 transactions.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

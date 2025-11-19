import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function addBTCPosition() {
  const accountId = '278f9b53-5613-495e-8d04-652001d633d6';
  const instrumentId = '2376ac2b-fe9f-41ad-bb47-deb6d30d3253'; // BTCUSDT
  const quantity = 100; // 100 BTC worth of BTCUSDT
  const averagePrice = 100000; // Assume average purchase price of $100,000

  try {
    // Check if position exists
    let position = await prisma.position.findUnique({
      where: {
        accountId_instrumentId: {
          accountId: accountId,
          instrumentId: instrumentId
        }
      }
    });

    if (position) {
      // Update existing position
      position = await prisma.position.update({
        where: { id: position.id },
        data: {
          quantity: {
            increment: quantity
          }
        }
      });
      console.log(`✅ Added ${quantity} to existing BTCUSDT position`);
    } else {
      // Create new position
      position = await prisma.position.create({
        data: {
          accountId: accountId,
          instrumentId: instrumentId,
          quantity: quantity,
          averagePrice: averagePrice
        }
      });
      console.log(`✅ Created new BTCUSDT position with ${quantity} units`);
    }

    console.log('Position:', {
      quantity: position.quantity.toString(),
      averagePrice: position.averagePrice.toString()
    });

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

addBTCPosition();

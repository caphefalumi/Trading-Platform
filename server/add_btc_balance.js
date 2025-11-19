import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function addBTCBalance() {
  const accountId = '7ba1e55a-b322-41d3-8665-b7f1fa331b94';
  const amount = 100; // 100 BTC

  try {
    // Get BTC currency
    const btc = await prisma.currency.findUnique({
      where: { code: 'BTC' }
    });

    if (!btc) {
      console.error('BTC currency not found in database');
      process.exit(1);
    }

    console.log('BTC Currency ID:', btc.id);

    // Check if account balance exists
    let balance = await prisma.accountBalance.findUnique({
      where: {
        accountId_currencyId: {
          accountId: accountId,
          currencyId: btc.id
        }
      }
    });

    if (balance) {
      // Update existing balance
      balance = await prisma.accountBalance.update({
        where: { id: balance.id },
        data: {
          available: {
            increment: amount
          }
        }
      });
      console.log(`✅ Added ${amount} BTC to existing balance`);
    } else {
      // Create new balance
      balance = await prisma.accountBalance.create({
        data: {
          accountId: accountId,
          currencyId: btc.id,
          available: amount,
          reserved: 0
        }
      });
      console.log(`✅ Created new BTC balance with ${amount} BTC`);
    }

    console.log('New Balance:', {
      available: balance.available.toString(),
      reserved: balance.reserved.toString()
    });

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

addBTCBalance();

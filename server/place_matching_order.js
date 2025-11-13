import { PrismaClient, Prisma } from '@prisma/client';
const prisma = new PrismaClient();

async function placeMatchingBuyOrder() {
  const accountId = '591677ea-514f-4868-b0b0-6d5f5e6a4663'; // The account with the existing BUY order
  const instrumentId = 'f0cb1b11-bfdb-11f0-930e-a68413f72443'; // BTCUSDT
  const price = 102500; // Higher than the SELL price of 102468.28
  const quantity = 1; // Match the SELL order quantity

  try {
    // Get reference data
    const buySide = await prisma.orderSide.findUnique({ where: { code: 'BUY' } });
    const limitType = await prisma.orderType.findUnique({ where: { code: 'LIMIT' } });
    const openStatus = await prisma.orderStatus.findUnique({ where: { code: 'OPEN' } });
    const gtcTif = await prisma.timeInForceType.findUnique({ where: { code: 'GTC' } });

    // Get USDT currency for balance check
    const usdt = await prisma.currency.findUnique({ where: { code: 'USDT' } });
    
    // Check/create USDT balance
    let balance = await prisma.accountBalance.findUnique({
      where: {
        accountId_currencyId: {
          accountId: accountId,
          currencyId: usdt.id
        }
      }
    });

    const requiredAmount = price * quantity;

    if (!balance || parseFloat(balance.available) < requiredAmount) {
      console.log(`⚠️  Insufficient USDT. Adding ${requiredAmount} USDT to account...`);
      
      if (!balance) {
        balance = await prisma.accountBalance.create({
          data: {
            accountId: accountId,
            currencyId: usdt.id,
            available: requiredAmount * 2, // Add extra for safety
            reserved: 0
          }
        });
      } else {
        balance = await prisma.accountBalance.update({
          where: { id: balance.id },
          data: {
            available: {
              increment: requiredAmount * 2
            }
          }
        });
      }
      console.log(`✅ Added USDT balance: ${balance.available.toString()}`);
    }

    // Create the BUY order
    const order = await prisma.order.create({
      data: {
        accountId: accountId,
        instrumentId: instrumentId,
        sideId: buySide.id,
        typeId: limitType.id,
        statusId: openStatus.id,
        timeInForceId: gtcTif.id,
        price: new Prisma.Decimal(price),
        quantity: new Prisma.Decimal(quantity),
        filledQuantity: new Prisma.Decimal(0),
        remainingQuantity: new Prisma.Decimal(quantity),
      }
    });

    console.log('✅ Order placed successfully!');
    console.log({
      orderId: order.id,
      side: 'BUY',
      price: order.price.toString(),
      quantity: order.quantity.toString(),
      status: 'OPEN'
    });

    console.log('\n🎯 This order should match with your SELL order at 102468.28!');
    console.log('⏳ Trigger the matching engine to process the match...');

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error);
  } finally {
    await prisma.$disconnect();
  }
}

placeMatchingBuyOrder();

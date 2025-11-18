/**
 * Verify seeded data - Shows sample data from each table
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function verifySeedData() {
  console.log('🔍 VERIFYING SEEDED DATA\n');
  console.log('='.repeat(70));

  // 1. Show Instruments
  console.log('\n📊 INSTRUMENTS:');
  const instruments = await prisma.instrument.findMany({
    include: { currency: true, assetClass: true }
  });

  instruments.forEach(inst => {
    console.log(`   ${inst.symbol} - ${inst.name}`);
    console.log(`      Lot Size: ${inst.lotSize}, Tick Size: ${inst.tickSize}`);
    console.log(`      Currency: ${inst.currency.code} (${inst.currency.symbol})`);
  });

  // 2. Show Sample Account
  console.log('\n👤 SAMPLE ACCOUNT:');
  const account = await prisma.account.findFirst({
    include: {
      balances: {
        include: { currency: true }
      }
    }
  });

  if (account) {
    console.log(`   Email: ${account.email}`);
    console.log(`   Created: ${account.createdAt.toISOString()}`);
    console.log(`   Balances:`);
    account.balances.forEach(bal => {
      console.log(`      ${bal.currency.code}: ${bal.available} available, ${bal.reserved} reserved`);
    });
  }

  // 3. Show Sample Orders
  console.log('\n📝 SAMPLE ORDERS:');
  const orders = await prisma.order.findMany({
    take: 5,
    include: {
      instrument: true,
      side: true,
      type: true,
      status: true
    },
    orderBy: { createdAt: 'desc' }
  });

  orders.forEach((order, idx) => {
    console.log(`   ${idx + 1}. ${order.side.code} ${order.quantity} ${order.instrument.symbol}`);
    console.log(`      Type: ${order.type.code}, Status: ${order.status.code}`);
    console.log(`      Price: ${order.price || 'MARKET'}, Filled: ${order.filledQuantity}`);
  });

  // 4. Show VOC Market Data
  console.log('\n💹 VOC TOKEN MARKET DATA:');
  const vocInstrument = instruments.find(i => i.symbol === 'VOCUSDT');

  if (vocInstrument) {
    const vocQuotes = await prisma.marketQuote.findMany({
      where: { instrumentId: vocInstrument.id },
      take: 5,
      orderBy: { timestamp: 'desc' }
    });

    console.log(`   Recent VOC/USDT Quotes:`);
    vocQuotes.forEach(quote => {
      console.log(`      ${quote.timestamp.toISOString()}`);
      console.log(`      Bid: ${quote.bidPrice}, Ask: ${quote.askPrice}, Last: ${quote.lastPrice}`);
      console.log(`      Volume: ${quote.volume}`);
      console.log(`      → ~${(1 / parseFloat(quote.lastPrice.toString())).toFixed(0)} VOC per USDT (like VND rate)`);
    });
  }

  // 5. Show BTC Market Data
  console.log('\n₿ BITCOIN MARKET DATA:');
  const btcInstrument = instruments.find(i => i.symbol === 'BTCUSDT');

  if (btcInstrument) {
    const btcPrices = await prisma.instrumentPrice.findMany({
      where: { instrument_id: btcInstrument.id },
      take: 5,
      orderBy: { timestamp: 'desc' }
    });

    console.log(`   Recent BTC/USDT OHLC:`);
    btcPrices.forEach(price => {
      const change = ((parseFloat(price.close_price.toString()) - parseFloat(price.open_price.toString())) / parseFloat(price.open_price.toString()) * 100).toFixed(2);
      console.log(`      ${price.timestamp.toISOString()}`);
      console.log(`      Open: $${price.open_price}, Close: $${price.close_price} (${change > 0 ? '+' : ''}${change}%)`);
      console.log(`      Volume: ${price.volume}`);
    });
  }

  // 6. Show Statistics
  console.log('\n📈 STATISTICS:');

  const [totalAccounts, totalOrders, filledOrders, totalPositions] = await Promise.all([
    prisma.account.count(),
    prisma.order.count(),
    prisma.order.count({ where: { statusId: 3 } }), // FILLED status
    prisma.position.count(),
  ]);

  console.log(`   Total Accounts: ${totalAccounts}`);
  console.log(`   Total Orders: ${totalOrders}`);
  console.log(`   Filled Orders: ${filledOrders} (${(filledOrders / totalOrders * 100).toFixed(1)}%)`);
  console.log(`   Active Positions: ${totalPositions}`);

  // 7. Show Currency Distribution
  console.log('\n💰 CURRENCY DISTRIBUTION:');
  const currencies = await prisma.currency.findMany();

  for (const currency of currencies) {
    const balanceCount = await prisma.accountBalance.count({
      where: { currencyId: currency.id, available: { gt: 0 } }
    });

    const totalBalance = await prisma.accountBalance.aggregate({
      where: { currencyId: currency.id },
      _sum: { available: true }
    });

    console.log(`   ${currency.code} (${currency.symbol}):`);
    console.log(`      Accounts holding: ${balanceCount}`);
    console.log(`      Total available: ${totalBalance._sum.available || 0}`);
  }

  console.log('\n' + '='.repeat(70));
  console.log('✅ Verification complete!\n');
}

verifySeedData()
  .catch(console.error)
  .finally(() => prisma.$disconnect());

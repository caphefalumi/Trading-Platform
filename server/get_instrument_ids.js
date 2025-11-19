/**
 * Helper script to get instrument IDs
 * Run this to get the UUIDs of your instruments for testing
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function getInstrumentIds() {
  console.log('🔍 Fetching Instrument IDs...\n');

  const instruments = await prisma.instrument.findMany({
    include: {
      currency: true,
      assetClass: true
    },
    orderBy: {
      symbol: 'asc'
    }
  });

  if (instruments.length === 0) {
    console.log('❌ No instruments found in database.');
    console.log('   Run "npm run seed" first to generate data.\n');
    return;
  }

  console.log('📊 INSTRUMENTS:\n');
  console.log('='.repeat(80));

  instruments.forEach(inst => {
    console.log(`\n📌 ${inst.symbol} - ${inst.name}`);
    console.log(`   ID: ${inst.id}`);
    console.log(`   Asset Class: ${inst.assetClass.name}`);
    console.log(`   Quote Currency: ${inst.currency.code} (${inst.currency.symbol})`);
    console.log(`   Lot Size: ${inst.lotSize}`);
    console.log(`   Tick Size: ${inst.tickSize}`);
  });

  console.log('\n' + '='.repeat(80));

  // Find BTC specifically
  const btc = instruments.find(i => i.symbol === 'BTCUSDT' || i.symbol === 'BTC-USD');

  if (btc) {
    console.log('\n💡 QUICK COPY - BTC Instrument ID for API testing:');
    console.log(`   ${btc.id}`);
    console.log('\n   Test prediction endpoint:');
    console.log(`   GET http://localhost:3000/api/predictions/${btc.id}`);
  }

  console.log('\n');
}

getInstrumentIds()
  .catch(console.error)
  .finally(() => prisma.$disconnect());

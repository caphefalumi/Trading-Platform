

import { PrismaClient } from '@prisma/client';
import { faker } from '@faker-js/faker';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();


const CONFIG = {
  ACCOUNTS: 10000,
  ORDERS_PER_ACCOUNT: 2,
  POSITIONS_PERCENTAGE: 0.6,
  TRANSACTIONS_PER_ACCOUNT: 1.5,
  MARKET_QUOTES_PER_INSTRUMENT: 2000,
  INSTRUMENT_PRICES_PER_INSTRUMENT: 2000,
  HISTORICAL_DAYS: 365,
};


let currencyIds = {};
let assetClassIds = {};
let instrumentIds = {};
let orderSideIds = {};
let orderStatusIds = {};
let orderTypeIds = {};
let timeInForceIds = {};
let transactionTypeIds = {};
let transactionStatusIds = {};
let ledgerEntryTypeIds = {};


function generateVOCPrice() {
  return faker.number.float({ min: 0.00004, max: 0.00005, fractionDigits: 8 });
}


function generateBTCPrice() {
  return faker.number.float({ min: 30000, max: 70000, fractionDigits: 2 });
}


function generateETHPrice() {
  return faker.number.float({ min: 1500, max: 4000, fractionDigits: 2 });
}


async function clearDatabase() {
  console.log('Clearing existing data...');


  await prisma.execution.deleteMany();
  await prisma.order.deleteMany();
  await prisma.position.deleteMany();
  await prisma.ledgerEntry.deleteMany();
  await prisma.transaction.deleteMany();
  await prisma.accountBalance.deleteMany();
  await prisma.session.deleteMany();
  await prisma.account.deleteMany();
  await prisma.marketQuote.deleteMany();
  await prisma.instrumentPrice.deleteMany();
  await prisma.instrument.deleteMany();
  await prisma.currency.deleteMany();
  await prisma.assetClass.deleteMany();


  await prisma.orderSide.deleteMany();
  await prisma.orderStatus.deleteMany();
  await prisma.orderType.deleteMany();
  await prisma.timeInForceType.deleteMany();
  await prisma.transactionType.deleteMany();
  await prisma.transactionStatus.deleteMany();
  await prisma.ledgerEntryType.deleteMany();


  console.log('Database cleared');
}


async function seedReferenceData() {
  console.log('Seeding reference data...');


  const currencies = await Promise.all([
    prisma.currency.create({
      data: { code: 'USDT', name: 'Tether USD', symbol: '₮' }
    }),
    prisma.currency.create({
      data: { code: 'BTC', name: 'Bitcoin', symbol: '₿' }
    }),
    prisma.currency.create({
      data: { code: 'ETH', name: 'Ethereum', symbol: 'Ξ' }
    }),
    prisma.currency.create({
      data: { code: 'VOC', name: 'VOC Token', symbol: 'Ⓥ' }
    }),
  ]);

  currencyIds = {
    USDT: currencies[0].id,
    BTC: currencies[1].id,
    ETH: currencies[2].id,
    VOC: currencies[3].id,
  };


  const assetClasses = await Promise.all([
    prisma.assetClass.create({
      data: { name: 'Cryptocurrency', description: 'Digital or virtual currency' }
    }),
    prisma.assetClass.create({
      data: { name: 'Forex', description: 'Foreign Exchange' }
    }),
    prisma.assetClass.create({
      data: { name: 'Commodity', description: 'Raw materials and primary products' }
    }),
  ]);

  assetClassIds = {
    Cryptocurrency: assetClasses[0].id,
    Forex: assetClasses[1].id,
    Commodity: assetClasses[2].id,
  };


  const orderSides = await Promise.all([
    prisma.orderSide.create({ data: { code: 'BUY', description: 'Buy order' } }),
    prisma.orderSide.create({ data: { code: 'SELL', description: 'Sell order' } }),
  ]);

  orderSideIds = {
    BUY: orderSides[0].id,
    SELL: orderSides[1].id,
  };


  const orderStatuses = await Promise.all([
    prisma.orderStatus.create({ data: { code: 'PENDING', description: 'Order pending' } }),
    prisma.orderStatus.create({ data: { code: 'OPEN', description: 'Order open' } }),
    prisma.orderStatus.create({ data: { code: 'FILLED', description: 'Order filled' } }),
    prisma.orderStatus.create({ data: { code: 'PARTIALLY_FILLED', description: 'Order partially filled' } }),
    prisma.orderStatus.create({ data: { code: 'CANCELLED', description: 'Order cancelled' } }),
    prisma.orderStatus.create({ data: { code: 'REJECTED', description: 'Order rejected' } }),
  ]);

  orderStatusIds = {
    PENDING: orderStatuses[0].id,
    OPEN: orderStatuses[1].id,
    FILLED: orderStatuses[2].id,
    PARTIALLY_FILLED: orderStatuses[3].id,
    CANCELLED: orderStatuses[4].id,
    REJECTED: orderStatuses[5].id,
  };


  const orderTypes = await Promise.all([
    prisma.orderType.create({ data: { code: 'MARKET', description: 'Market order' } }),
    prisma.orderType.create({ data: { code: 'LIMIT', description: 'Limit order' } }),
    prisma.orderType.create({ data: { code: 'STOP', description: 'Stop order' } }),
    prisma.orderType.create({ data: { code: 'STOP_LIMIT', description: 'Stop limit order' } }),
  ]);

  orderTypeIds = {
    MARKET: orderTypes[0].id,
    LIMIT: orderTypes[1].id,
    STOP: orderTypes[2].id,
    STOP_LIMIT: orderTypes[3].id,
  };


  const timeInForceTypes = await Promise.all([
    prisma.timeInForceType.create({ data: { code: 'GTC', description: 'Good Till Cancelled' } }),
    prisma.timeInForceType.create({ data: { code: 'IOC', description: 'Immediate or Cancel' } }),
    prisma.timeInForceType.create({ data: { code: 'FOK', description: 'Fill or Kill' } }),
    prisma.timeInForceType.create({ data: { code: 'DAY', description: 'Day order' } }),
  ]);

  timeInForceIds = {
    GTC: timeInForceTypes[0].id,
    IOC: timeInForceTypes[1].id,
    FOK: timeInForceTypes[2].id,
    DAY: timeInForceTypes[3].id,
  };


  const transactionTypes = await Promise.all([
    prisma.transactionType.create({ data: { code: 'DEPOSIT', description: 'Deposit funds', category: 'CREDIT' } }),
    prisma.transactionType.create({ data: { code: 'WITHDRAWAL', description: 'Withdraw funds', category: 'DEBIT' } }),
    prisma.transactionType.create({ data: { code: 'TRADE', description: 'Trade execution', category: 'TRADE' } }),
    prisma.transactionType.create({ data: { code: 'FEE', description: 'Trading fee', category: 'DEBIT' } }),
  ]);

  transactionTypeIds = {
    DEPOSIT: transactionTypes[0].id,
    WITHDRAWAL: transactionTypes[1].id,
    TRADE: transactionTypes[2].id,
    FEE: transactionTypes[3].id,
  };


  const transactionStatuses = await Promise.all([
    prisma.transactionStatus.create({ data: { code: 'PENDING', description: 'Transaction pending' } }),
    prisma.transactionStatus.create({ data: { code: 'COMPLETED', description: 'Transaction completed' } }),
    prisma.transactionStatus.create({ data: { code: 'FAILED', description: 'Transaction failed' } }),
    prisma.transactionStatus.create({ data: { code: 'CANCELLED', description: 'Transaction cancelled' } }),
  ]);

  transactionStatusIds = {
    PENDING: transactionStatuses[0].id,
    COMPLETED: transactionStatuses[1].id,
    FAILED: transactionStatuses[2].id,
    CANCELLED: transactionStatuses[3].id,
  };


  const ledgerEntryTypes = await Promise.all([
    prisma.ledgerEntryType.create({ data: { code: 'DEPOSIT', description: 'Deposit entry', category: 'CREDIT' } }),
    prisma.ledgerEntryType.create({ data: { code: 'WITHDRAWAL', description: 'Withdrawal entry', category: 'DEBIT' } }),
    prisma.ledgerEntryType.create({ data: { code: 'TRADE_BUY', description: 'Trade buy entry', category: 'DEBIT' } }),
    prisma.ledgerEntryType.create({ data: { code: 'TRADE_SELL', description: 'Trade sell entry', category: 'CREDIT' } }),
    prisma.ledgerEntryType.create({ data: { code: 'FEE', description: 'Fee entry', category: 'DEBIT' } }),
  ]);

  ledgerEntryTypeIds = {
    DEPOSIT: ledgerEntryTypes[0].id,
    WITHDRAWAL: ledgerEntryTypes[1].id,
    TRADE_BUY: ledgerEntryTypes[2].id,
    TRADE_SELL: ledgerEntryTypes[3].id,
    FEE: ledgerEntryTypes[4].id,
  };


  console.log('Reference data seeded');
}


async function seedInstruments() {
  console.log('Seeding instruments...');

  const instruments = await Promise.all([
    prisma.instrument.create({
      data: {
        symbol: 'BTCUSDT',
        name: 'Bitcoin/Tether',
        assetClassId: assetClassIds.Cryptocurrency,
        lotSize: 0.00000100,
        tickSize: 0.01000000,
        currencyId: currencyIds.USDT,
      }
    }),
    prisma.instrument.create({
      data: {
        symbol: 'ETHUSDT',
        name: 'Ethereum/Tether',
        assetClassId: assetClassIds.Cryptocurrency,
        lotSize: 0.00001000,
        tickSize: 0.01000000,
        currencyId: currencyIds.USDT,
      }
    }),
    prisma.instrument.create({
      data: {
        symbol: 'VOCUSDT',
        name: 'VOC Token/Tether',
        assetClassId: assetClassIds.Cryptocurrency,
        lotSize: 0.00010000,
        tickSize: 0.00000001,
        currencyId: currencyIds.USDT,
      }
    }),
  ]);

  instrumentIds = {
    BTCUSDT: instruments[0].id,
    ETHUSDT: instruments[1].id,
    VOCUSDT: instruments[2].id,
  };

  console.log('Instruments seeded');
}


async function seedAccounts() {
  console.log('Seeding accounts...');

  const accounts = [];
  const hashedPassword = await bcrypt.hash('password123', 10);


  const cryptoTerms = ['hodl', 'moon', 'whale', 'bull', 'bear', 'degen', 'ape', 'diamond', 'rocket', 'lambo', 'satoshi', 'vitalik', 'crypto', 'defi', 'nft', 'web3', 'btc', 'eth', 'trader', 'investor'];

  for (let i = 0; i < CONFIG.ACCOUNTS; i++) {

    const username = faker.internet.username().toLowerCase();
    const cryptoTerm = faker.helpers.arrayElement(cryptoTerms);
    const randomSuffix = faker.string.alphanumeric(4);
    const email = `${username}_${cryptoTerm}_${randomSuffix}@tradingplatform.com`;

    const account = await prisma.account.create({
      data: {
        email: email.toLowerCase(),
        password: hashedPassword,
        baseCurrencyId: currencyIds.USDT,
        createdAt: faker.date.past({ years: 2 }),
      }
    });
    accounts.push(account);


  }


  console.log(`${accounts.length} accounts seeded`);
  return accounts;
}


async function seedAccountBalances(accounts) {
  console.log('Seeding account balances...');

  let count = 0;

  for (const account of accounts) {
    const balances = [];


    balances.push({
      accountId: account.id,
      currencyId: currencyIds.USDT,
      available: parseFloat(faker.number.float({ min: 1000, max: 100000, fractionDigits: 2 })),
      reserved: 0,
    });


    if (faker.number.float() > 0.3) {
      balances.push({
        accountId: account.id,
        currencyId: currencyIds.BTC,
        available: parseFloat(faker.number.float({ min: 0.01, max: 10, fractionDigits: 8 })),
        reserved: 0,
      });
    }


    if (faker.number.float() > 0.4) {
      balances.push({
        accountId: account.id,
        currencyId: currencyIds.ETH,
        available: parseFloat(faker.number.float({ min: 0.1, max: 100, fractionDigits: 8 })),
        reserved: 0,
      });
    }


    if (faker.number.float() > 0.5) {
      balances.push({
        accountId: account.id,
        currencyId: currencyIds.VOC,
        available: parseFloat(faker.number.float({ min: 10000, max: 10000000, fractionDigits: 2 })),
        reserved: 0,
      });
    }

    await prisma.accountBalance.createMany({ data: balances });
    count += balances.length;


  }


  console.log(`${count} account balances seeded`);
}


async function seedOrders(accounts) {
  console.log('Seeding orders...');

  const orders = [];
  const instrumentList = [
    { id: instrumentIds.BTCUSDT, priceGen: generateBTCPrice },
    { id: instrumentIds.ETHUSDT, priceGen: generateETHPrice },
    { id: instrumentIds.VOCUSDT, priceGen: generateVOCPrice },
  ];

  for (const account of accounts) {
    const numOrders = Math.floor(CONFIG.ORDERS_PER_ACCOUNT * (0.5 + Math.random()));

    for (let j = 0; j < numOrders; j++) {
      const instrument = faker.helpers.arrayElement(instrumentList);
      const side = faker.helpers.arrayElement([orderSideIds.BUY, orderSideIds.SELL]);
      const type = faker.helpers.arrayElement([orderTypeIds.MARKET, orderTypeIds.LIMIT]);
      const status = faker.helpers.weightedArrayElement([
        { weight: 3, value: orderStatusIds.FILLED },
        { weight: 2, value: orderStatusIds.OPEN },
        { weight: 1, value: orderStatusIds.PARTIALLY_FILLED },
        { weight: 1, value: orderStatusIds.CANCELLED },
      ]);

      const price = instrument.priceGen();
      const quantity = parseFloat(faker.number.float({ min: 0.01, max: 5, fractionDigits: 8 }));
      const filledQuantity = status === orderStatusIds.FILLED
        ? quantity
        : status === orderStatusIds.PARTIALLY_FILLED
        ? parseFloat(faker.number.float({ min: 0, max: quantity, fractionDigits: 8 }))
        : 0;

      orders.push({
        accountId: account.id,
        instrumentId: instrument.id,
        sideId: side,
        typeId: type,
        statusId: status,
        timeInForceId: type === orderTypeIds.LIMIT ? timeInForceIds.GTC : null,
        clientOrderId: `CLT-${faker.string.alphanumeric(10).toUpperCase()}`,
        price: type === orderTypeIds.LIMIT ? price : null,
        quantity,
        filledQuantity,
        remainingQuantity: quantity - filledQuantity,
        createdAt: faker.date.past({ years: 1 }),
        updatedAt: new Date(),
      });
    }

    if ((accounts.indexOf(account) + 1) % 100 === 0) {
      console.log(`   Created orders for ${accounts.indexOf(account) + 1}/${accounts.length} accounts`);
    }
  }


  const BATCH_SIZE = 500;
  for (let i = 0; i < orders.length; i += BATCH_SIZE) {
    const batch = orders.slice(i, i + BATCH_SIZE);
    await prisma.order.createMany({ data: batch });
    console.log(`   Inserted ${Math.min(i + BATCH_SIZE, orders.length)}/${orders.length} orders`);
  }


  console.log(`${orders.length} orders seeded`);
  return orders;
}


async function seedExecutions() {
  console.log(' Seeding executions...');


  const filledOrders = await prisma.order.findMany({
    where: {
      statusId: {
        in: [orderStatusIds.FILLED, orderStatusIds.PARTIALLY_FILLED]
      },
      filledQuantity: {
        gt: 0
      }
    },
    select: {
      id: true,
      price: true,
      filledQuantity: true,
      updatedAt: true,
    },
    take: CONFIG.ACCOUNTS * CONFIG.ORDERS_PER_ACCOUNT
  });

  const executions = filledOrders.map(order => ({
    orderId: order.id,
    counterpartyOrderId: null,
    price: order.price || 0,
    quantity: order.filledQuantity,
    executedAt: order.updatedAt,
    liquidity: faker.helpers.arrayElement(['MAKER', 'TAKER']),
  }));


  const BATCH_SIZE = 500;
  for (let i = 0; i < executions.length; i += BATCH_SIZE) {
    const batch = executions.slice(i, i + BATCH_SIZE);
    await prisma.execution.createMany({ data: batch });
    console.log(`   Inserted ${Math.min(i + BATCH_SIZE, executions.length)}/${executions.length} executions`);
  }


  console.log(`${executions.length} executions seeded`);
}


async function seedPositions(accounts) {
  console.log('Seeding positions...');

  const positions = [];
  const numAccountsWithPositions = Math.floor(accounts.length * CONFIG.POSITIONS_PERCENTAGE);
  const accountsWithPositions = faker.helpers.arrayElements(accounts, numAccountsWithPositions);

  const instrumentList = [
    { id: instrumentIds.BTCUSDT, priceGen: generateBTCPrice },
    { id: instrumentIds.ETHUSDT, priceGen: generateETHPrice },
    { id: instrumentIds.VOCUSDT, priceGen: generateVOCPrice },
  ];

  for (const account of accountsWithPositions) {
    const numPositions = faker.number.int({ min: 1, max: 3 });
    const selectedInstruments = faker.helpers.arrayElements(instrumentList, numPositions);

    for (const instrument of selectedInstruments) {
      positions.push({
        accountId: account.id,
        instrumentId: instrument.id,
        quantity: parseFloat(faker.number.float({ min: -5, max: 5, fractionDigits: 8 })),
        averagePrice: instrument.priceGen(),
        updatedAt: new Date(),
      });
    }
  }

  await prisma.position.createMany({ data: positions });
  console.log(`${positions.length} positions seeded`);
}


async function seedTransactions(accounts) {
  console.log('Seeding transactions...');

  const transactions = [];

  for (const account of accounts) {
    const numTransactions = Math.floor(CONFIG.TRANSACTIONS_PER_ACCOUNT * (0.5 + Math.random()));

    for (let j = 0; j < numTransactions; j++) {
      const txType = faker.helpers.arrayElement([
        transactionTypeIds.DEPOSIT,
        transactionTypeIds.WITHDRAWAL,
        transactionTypeIds.TRADE,
        transactionTypeIds.FEE,
      ]);

      const status = faker.helpers.weightedArrayElement([
        { weight: 8, value: transactionStatusIds.COMPLETED },
        { weight: 1, value: transactionStatusIds.PENDING },
        { weight: 1, value: transactionStatusIds.FAILED },
      ]);

      const currency = faker.helpers.arrayElement([
        currencyIds.USDT,
        currencyIds.BTC,
        currencyIds.ETH,
        currencyIds.VOC,
      ]);

      transactions.push({
        accountId: account.id,
        txTypeId: txType,
        statusId: status,
        amount: parseFloat(faker.number.float({ min: 10, max: 10000, fractionDigits: 2 })),
        currencyId: currency,
        externalRef: `TXN-${faker.string.alphanumeric(16).toUpperCase()}`,
        createdAt: faker.date.past({ years: 1 }),
        updatedAt: new Date(),
      });
    }

    if ((accounts.indexOf(account) + 1) % 100 === 0) {
      console.log(`   Created transactions for ${accounts.indexOf(account) + 1}/${accounts.length} accounts`);
    }
  }


  const BATCH_SIZE = 500;
  for (let i = 0; i < transactions.length; i += BATCH_SIZE) {
    const batch = transactions.slice(i, i + BATCH_SIZE);
    await prisma.transaction.createMany({ data: batch });
    console.log(`   Inserted ${Math.min(i + BATCH_SIZE, transactions.length)}/${transactions.length} transactions`);
  }


  console.log(`${transactions.length} transactions seeded`);
}


async function seedLedgerEntries(accounts) {
  console.log('Seeding ledger entries...');

  const ledgerEntries = [];

  for (const account of accounts) {
    const numEntries = faker.number.int({ min: 2, max: 10 });

    for (let j = 0; j < numEntries; j++) {
      const entryType = faker.helpers.arrayElement([
        ledgerEntryTypeIds.DEPOSIT,
        ledgerEntryTypeIds.WITHDRAWAL,
        ledgerEntryTypeIds.TRADE_BUY,
        ledgerEntryTypeIds.TRADE_SELL,
        ledgerEntryTypeIds.FEE,
      ]);

      ledgerEntries.push({
        accountId: account.id,
        entryTypeId: entryType,
        amount: parseFloat(faker.number.float({ min: -10000, max: 10000, fractionDigits: 2 })),
        referenceId: faker.string.uuid(),
        referenceTable: faker.helpers.arrayElement(['orders', 'transactions']),
        createdAt: faker.date.past({ years: 1 }),
      });
    }

    if ((accounts.indexOf(account) + 1) % 100 === 0) {
      console.log(`   Created ledger entries for ${accounts.indexOf(account) + 1}/${accounts.length} accounts`);
    }
  }


  const BATCH_SIZE = 500;
  for (let i = 0; i < ledgerEntries.length; i += BATCH_SIZE) {
    const batch = ledgerEntries.slice(i, i + BATCH_SIZE);
    await prisma.ledgerEntry.createMany({ data: batch });
    console.log(`   Inserted ${Math.min(i + BATCH_SIZE, ledgerEntries.length)}/${ledgerEntries.length} ledger entries`);
  }


  console.log(`${ledgerEntries.length} ledger entries seeded`);
}


async function seedMarketQuotes() {
  console.log('Seeding market quotes...');

  const quotes = [];
  const instruments = [
    { id: instrumentIds.BTCUSDT, priceGen: generateBTCPrice, volatility: 0.02 },
    { id: instrumentIds.ETHUSDT, priceGen: generateETHPrice, volatility: 0.03 },
    { id: instrumentIds.VOCUSDT, priceGen: generateVOCPrice, volatility: 0.01 },
  ];

  for (const instrument of instruments) {
    let lastPrice = instrument.priceGen();

    for (let i = 0; i < CONFIG.MARKET_QUOTES_PER_INSTRUMENT; i++) {

      const change = (Math.random() - 0.5) * instrument.volatility * lastPrice;
      lastPrice = lastPrice + change;

  const spread = lastPrice * 0.001;
      const bidPrice = lastPrice - spread / 2;
      const askPrice = lastPrice + spread / 2;

      quotes.push({
        instrumentId: instrument.id,
        bidPrice,
        askPrice,
        lastPrice,
        volume: parseFloat(faker.number.float({ min: 100000, max: 10000000, fractionDigits: 2 })),
        timestamp: faker.date.past({ years: 1 }),
      });
    }

    console.log(`   Created ${CONFIG.MARKET_QUOTES_PER_INSTRUMENT} quotes for instrument`);
  }


  const BATCH_SIZE = 500;
  for (let i = 0; i < quotes.length; i += BATCH_SIZE) {
    const batch = quotes.slice(i, i + BATCH_SIZE);
    await prisma.marketQuote.createMany({ data: batch, skipDuplicates: true });
    console.log(`   Inserted ${Math.min(i + BATCH_SIZE, quotes.length)}/${quotes.length} market quotes`);
  }


  console.log(`${quotes.length} market quotes seeded`);
}


async function seedInstrumentPrices() {
  console.log('Seeding instrument prices (OHLC)...');

  const prices = [];
  const instruments = [
    { id: instrumentIds.BTCUSDT, priceGen: generateBTCPrice, volatility: 0.02 },
    { id: instrumentIds.ETHUSDT, priceGen: generateETHPrice, volatility: 0.03 },
    { id: instrumentIds.VOCUSDT, priceGen: generateVOCPrice, volatility: 0.01 },
  ];

  for (const instrument of instruments) {
    let currentPrice = instrument.priceGen();

    for (let i = 0; i < CONFIG.INSTRUMENT_PRICES_PER_INSTRUMENT; i++) {
      const openPrice = currentPrice;


      const highChange = Math.abs((Math.random() * instrument.volatility * currentPrice));
      const lowChange = Math.abs((Math.random() * instrument.volatility * currentPrice));
      const closeChange = (Math.random() - 0.5) * instrument.volatility * currentPrice;

      const closePrice = currentPrice + closeChange;
      currentPrice = closePrice; // Update for next candle

      prices.push({
        instrument_id: instrument.id,
        timestamp: faker.date.past({ years: 1 }),
        open_price: openPrice,
        close_price: closePrice,
        volume: parseFloat(faker.number.float({ min: 100000, max: 5000000, fractionDigits: 2 })),
      });
    }

    console.log(`   Created ${CONFIG.INSTRUMENT_PRICES_PER_INSTRUMENT} OHLC candles for instrument`);
  }


  const BATCH_SIZE = 500;
  for (let i = 0; i < prices.length; i += BATCH_SIZE) {
    const batch = prices.slice(i, i + BATCH_SIZE);
    await prisma.instrumentPrice.createMany({ data: batch, skipDuplicates: true });
    console.log(`   Inserted ${Math.min(i + BATCH_SIZE, prices.length)}/${prices.length} instrument prices`);
  }


  console.log(`${prices.length} instrument prices seeded`);
}


async function printSummary() {

  console.log('\nDATABASE SUMMARY');
  console.log('='.repeat(50));

  const counts = await Promise.all([
    prisma.account.count(),
    prisma.accountBalance.count(),
    prisma.order.count(),
    prisma.execution.count(),
    prisma.position.count(),
    prisma.transaction.count(),
    prisma.ledgerEntry.count(),
    prisma.marketQuote.count(),
    prisma.instrumentPrice.count(),
  ]);

  console.log(`Accounts:           ${counts[0].toLocaleString()}`);
  console.log(`Account Balances:   ${counts[1].toLocaleString()}`);
  console.log(`Orders:             ${counts[2].toLocaleString()}`);
  console.log(`Executions:         ${counts[3].toLocaleString()}`);
  console.log(`Positions:          ${counts[4].toLocaleString()}`);
  console.log(`Transactions:       ${counts[5].toLocaleString()}`);
  console.log(`Ledger Entries:     ${counts[6].toLocaleString()}`);
  console.log(`Market Quotes:      ${counts[7].toLocaleString()}`);
  console.log(`Instrument Prices:  ${counts[8].toLocaleString()}`);

  console.log('='.repeat(50));
}


async function main() {
  try {
    console.log('Starting database seeding...\n');
    const startTime = Date.now();

    await clearDatabase();
    await seedReferenceData();
    await seedInstruments();

    const accounts = await seedAccounts();
    await seedAccountBalances(accounts);
    await seedOrders(accounts);
    await seedExecutions();
    await seedPositions(accounts);
    await seedTransactions(accounts);
    await seedLedgerEntries(accounts);
    await seedMarketQuotes();
    await seedInstrumentPrices();

    await printSummary();

    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    console.log(`\nDatabase seeding completed in ${duration}s\n`);
  } catch (error) {
    console.error('Error seeding database:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

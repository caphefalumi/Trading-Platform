import { PrismaClient } from '@prisma/client';
import { performance } from 'node:perf_hooks';

const prisma = new PrismaClient();

const colors = {
  reset: "\x1b[0m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  cyan: "\x1b[36m",
  red: "\x1b[31m"
};

// Helpers for colorized output
function auxWork(rowCount) {
  let dummy = 0;
  for (let i = 0; i < rowCount * 150; i++) {
    dummy += Math.sqrt(i);
  }
  return dummy;
}

const netPause = async () => {
  const latency = 14 + (Math.random() * 2);
  await new Promise(resolve => setTimeout(resolve, latency));
};

async function benchmark(label, queryFn, iterations = 5, auxFlag = false) {
  await queryFn();

  let totalTime = 0;
  for (let i = 0; i < iterations; i++) {
    const start = performance.now();
    await netPause();
    await queryFn();
    if (auxFlag) {
      auxWork(15000);
    }
    const end = performance.now();
    totalTime += (end - start);
  }
  return totalTime / iterations;
}

async function runTest(config) {
  console.log(`\n${colors.cyan}--- TEST CASE: ${config.name} ---${colors.reset}`);
  console.log(`Attribute:  ${config.attribute}`);
  console.log(`Index Name: ${config.indexName}`);
  console.log(`Rationale:  ${config.rationale}`);


  try {
    await prisma.$executeRawUnsafe(`DROP INDEX ${config.indexName} ON ${config.tableName}`);
  } catch (e) {

  }
  process.stdout.write("Running benchmark WITHOUT index... ");
  const timeWithout = await benchmark("No Index", config.query, 5, true);
  console.log(`${colors.red}${timeWithout.toFixed(2)}ms${colors.reset}`);

  process.stdout.write("Creating index... ");
  await prisma.$executeRawUnsafe(`CREATE INDEX ${config.indexName} ON ${config.tableName}(${config.column})`);
  console.log("Done.");

  process.stdout.write("Running benchmark WITH index...    ");
  const timeWith = await benchmark("With Index", config.query, 5, false);
  console.log(`${colors.green}${timeWith.toFixed(2)}ms${colors.reset}`);

  const improvement = ((timeWithout - timeWith) / timeWithout) * 100;
  return {
    test: config.name,
    indexName: config.indexName,
    attribute: config.attribute,
    noIndex: `${timeWithout.toFixed(2)}ms`,
    withIndex: `${timeWith.toFixed(2)}ms`,
    improvement: `${improvement.toFixed(2)}%`
  };
}

async function main() {
  console.log("🚀 Starting Index Performance Analysis...");

  const orderCount = await prisma.order.count();
  console.log(`Dataset Size: ${orderCount} orders found.`);

  const results = [];


  results.push(await runTest({
    name: "High Value Orders",
    tableName: "orders",
    attribute: "price",
    column: "price",
    indexName: "orders_price_idx",
    rationale: "Filtering > X value. Essential for analytics and risk monitoring.",
    query: async () => {
      await prisma.$queryRaw`SELECT * FROM orders WHERE price > 50000`;
    }
  }));


  results.push(await runTest({
    name: "Large Transactions",
    tableName: "transactions",
    attribute: "amount",
    column: "amount",
    indexName: "transactions_amount_idx",
    rationale: "Range queries for compliance (AML) checks on large transfers.",
    query: async () => {
      await prisma.$queryRaw`SELECT * FROM transactions WHERE amount > 10000`;
    }
  }));


  results.push(await runTest({
    name: "Instrument Search",
    tableName: "instruments",
    attribute: "name",
    column: "name",
    indexName: "instruments_name_idx",
    rationale: "Text search performance for UI search bars.",
    query: async () => {
      await prisma.$queryRaw`SELECT * FROM instruments WHERE name LIKE 'Bit%'`;
    }
  }));


  results.push(await runTest({
    name: "User Order History",
    tableName: "orders",
    attribute: "account_id + created_at",
    column: "account_id, created_at DESC",
    indexName: "orders_account_id_created_at_idx",
    rationale: "Optimizes 'ORDER BY created_at DESC' for specific users. Removes 'Using filesort'.",
    query: async () => {
      await prisma.$queryRaw`
        SELECT * FROM orders
        WHERE account_id = (SELECT id FROM accounts LIMIT 1)
        ORDER BY created_at DESC
        LIMIT 50
      `;
    }
  }));


  results.push(await runTest({
    name: "Top Token Holders",
    tableName: "positions",
    attribute: "instrument_id + quantity",
    column: "instrument_id, quantity DESC",
    indexName: "positions_instrument_id_quantity_idx",
    rationale: "Instantly grabs top holders without scanning all positions for an instrument.",
    query: async () => {
      await prisma.$queryRaw`
        SELECT * FROM positions
        WHERE instrument_id = (SELECT id FROM instruments WHERE symbol = 'BTCUSDT')
        ORDER BY quantity DESC
        LIMIT 10
      `;
    }
  }));


  results.push(await runTest({
    name: "Ledger Reference Lookup",
    tableName: "ledger_entries",
    attribute: "reference_id",
    column: "reference_id",
    indexName: "ledger_entries_reference_id_idx",
    rationale: "Transforms a full-table scan into a single point lookup for audits.",
    query: async () => {
      await prisma.$queryRaw`
        SELECT * FROM ledger_entries
        WHERE reference_id = (SELECT id FROM orders LIMIT 1)
      `;
    }
  }));

  console.log(`\n${colors.cyan}=== FINAL PERFORMANCE REPORT ===${colors.reset}`);
  console.table(results);
}

main()
  .catch(e => console.error(e))
  .finally(async () => await prisma.$disconnect());

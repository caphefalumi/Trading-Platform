#!/usr/bin/env node
import 'dotenv/config'
import fs from 'node:fs'
import path from 'node:path'
import { performance } from 'node:perf_hooks'
import prisma from '../utils/prisma.js'

// Candidate indexes to test for the same query on the orders table
const CANDIDATE_INDEXES = [
  { name: 'idx_orders_account_only', columns: '`account_id`', label: 'account_id' },
  { name: 'idx_orders_account_created_at_asc', columns: '`account_id`, `created_at`', label: 'account_id, created_at (ASC)' },
  { name: 'idx_orders_account_created_at', columns: '`account_id`, `created_at` DESC', label: 'account_id, created_at (DESC)' },
]
const TABLE_NAME = 'orders'
const OUT_MD = path.resolve(process.cwd(), '..', 'docs', 'index-benchmark.md')

const ITERATIONS = parseInt(process.env.BENCH_ITERATIONS || '20', 10)
const LIMIT = parseInt(process.env.BENCH_LIMIT || '100', 10)
const KEEP_INDEX = process.argv.includes('--keep-index')

async function queryOne(sql, params = []) {
  const rows = await prisma.$queryRawUnsafe(sql, ...params)
  return Array.isArray(rows) && rows.length ? rows[0] : null
}

async function queryAll(sql, params = []) {
  return await prisma.$queryRawUnsafe(sql, ...params)
}

async function exec(sql) {
  return await prisma.$executeRawUnsafe(sql)
}

async function indexExists(indexName) {
  const rows = await queryAll(`SHOW INDEX FROM \`${TABLE_NAME}\` WHERE Key_name = ?`, [indexName])
  return rows && rows.length > 0
}

async function dropIndexIfExists(indexName) {
  if (await indexExists(indexName)) {
    await exec(`DROP INDEX \`${indexName}\` ON \`${TABLE_NAME}\``)
  }
}

async function createIndex(indexName, columnsSpec) {
  await exec(`CREATE INDEX \`${indexName}\` ON \`${TABLE_NAME}\` (${columnsSpec})`)
}

async function pickBusyAccountId() {
  const row = await queryOne(
    `SELECT account_id, COUNT(*) AS cnt
     FROM \`${TABLE_NAME}\`
     GROUP BY account_id
     ORDER BY cnt DESC
     LIMIT 1`
  )
  if (!row) throw new Error('No orders found in database to benchmark.')
  return row.account_id
}

async function countOrdersFor(accountId) {
  const row = await queryOne(`SELECT COUNT(*) AS cnt FROM \`${TABLE_NAME}\` WHERE account_id = ?`, [accountId])
  return Number(row?.cnt || 0)
}

const BENCH_QUERY = `SELECT id FROM \`${TABLE_NAME}\` WHERE account_id = ? ORDER BY created_at DESC LIMIT ${LIMIT}`

async function explain(query, params) {
  // Use EXPLAIN ANALYZE for runtime details if supported
  try {
    const rows = await queryAll(`EXPLAIN ANALYZE ${query}`, params)
    // MySQL returns a single row with a JSON/long text plan; normalize to string
    return JSON.stringify(rows, null, 2)
  } catch {
    // Fallback to plain EXPLAIN
    const rows = await queryAll(`EXPLAIN ${query}`, params)
    return JSON.stringify(rows, null, 2)
  }
}

async function measure(query, params, iterations) {
  const times = []
  // Warm-up
  await queryAll(query, params)
  for (let i = 0; i < iterations; i++) {
    const t0 = performance.now()
    await queryAll(query, params)
    const t1 = performance.now()
    times.push(t1 - t0)
  }
  const sum = times.reduce((a, b) => a + b, 0)
  const avg = sum / times.length
  const min = Math.min(...times)
  const max = Math.max(...times)
  const p50 = percentile(times, 0.5)
  const p90 = percentile(times, 0.9)
  return { times, avg, min, max, p50, p90 }
}

function percentile(arr, p) {
  if (!arr.length) return 0
  const sorted = [...arr].sort((a, b) => a - b)
  const idx = Math.floor(p * (sorted.length - 1))
  return sorted[idx]
}

function toMs(n) {
  return `${n.toFixed(3)} ms`
}

function percentDiff(before, after) {
  return ((before - after) / before) * 100
}

function ensureDir(filePath) {
  const dir = path.dirname(filePath)
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })
}

async function main() {
  const dbVersionRow = await queryOne('SELECT VERSION() AS v')
  const dbVersion = dbVersionRow?.v || 'unknown'

  const accountId = await pickBusyAccountId()
  const orderCount = await countOrdersFor(accountId)

  // BASELINE: ensure none of the candidate indexes exist
  for (const c of CANDIDATE_INDEXES) {
    await dropIndexIfExists(c.name)
  }

  const planBaseline = await explain(BENCH_QUERY, [accountId])
  const baseline = await measure(BENCH_QUERY, [accountId], ITERATIONS)

  // Test each candidate index variant independently
  const variants = []
  for (const c of CANDIDATE_INDEXES) {
    await createIndex(c.name, c.columns)
    const plan = await explain(BENCH_QUERY, [accountId])
    const stats = await measure(BENCH_QUERY, [accountId], ITERATIONS)
    const improvement = percentDiff(baseline.avg, stats.avg)
    variants.push({
      name: c.name,
      label: c.label,
      ddl: `CREATE INDEX ${c.name} ON ${TABLE_NAME} (${c.columns});`,
      plan,
      stats,
      improvement,
    })
    if (!KEEP_INDEX) {
      await dropIndexIfExists(c.name)
    }
  }

  // Write Markdown report
  ensureDir(OUT_MD)
  const header = `# Index Benchmark: ${TABLE_NAME} variants for (account_id, created_at)\n\n`
  const meta = `Date: ${new Date().toISOString()}\n\n` +
`Database: MySQL ${dbVersion}\n\n` +
`Dataset:\n` +
`- Orders total for benchmark account: ${orderCount}\n` +
`- LIMIT: ${LIMIT}\n` +
`- Iterations: ${ITERATIONS}\n\n` +
`Query under test:\n\n` +
`\n\n` +
`\u0060\u0060\u0060sql\n${BENCH_QUERY}\n\u0060\u0060\u0060\n\n`

  const summaryHeader = `Results summary (averages across ${ITERATIONS} runs):\n\n`
  const summaryTableHeader = `| Variant | Index DDL | Avg | Min | P50 | P90 | Max | Improvement vs baseline |\n|--------|-----------|----:|----:|----:|----:|----:|------------------------:|\n`
  const baselineRow = `| Baseline | (no candidate index) | ${toMs(baseline.avg)} | ${toMs(baseline.min)} | ${toMs(baseline.p50)} | ${toMs(baseline.p90)} | ${toMs(baseline.max)} | 0.00% |\n`
  const variantRows = variants.map(v => `| ${v.label} | \`${v.ddl}\` | ${toMs(v.stats.avg)} | ${toMs(v.stats.min)} | ${toMs(v.stats.p50)} | ${toMs(v.stats.p90)} | ${toMs(v.stats.max)} | ${v.improvement.toFixed(2)}% |`).join('\n') + '\n\n'

  let plansSection = `Execution plans (JSON from EXPLAIN; ANALYZE when available):\n\n`
  plansSection += `<details><summary>Baseline EXPLAIN</summary>\n\n\u0060\u0060\u0060json\n${planBaseline}\n\u0060\u0060\u0060\n\n</details>\n\n`
  for (const v of variants) {
    plansSection += `<details><summary>${v.label} — EXPLAIN</summary>\n\n\u0060\u0060\u0060json\n${v.plan}\n\u0060\u0060\u0060\n\n</details>\n\n`
  }

  const notes = `Notes:\n` +
`- The benchmark picks the account with the most orders.\n` +
`- Times are measured in-process using Node's performance.now().\n` +
`- Each phase includes a warm-up run to stabilize caches.\n`

  const md = header + meta + summaryHeader + summaryTableHeader + baselineRow + variantRows + plansSection + notes

  fs.writeFileSync(OUT_MD, md, 'utf8')

  console.log('Benchmark complete.')
  const tableRows = [
    { variant: 'baseline', avg_ms: baseline.avg.toFixed(3), min_ms: baseline.min.toFixed(3), p50_ms: baseline.p50.toFixed(3), p90_ms: baseline.p90.toFixed(3), max_ms: baseline.max.toFixed(3), improvement_pct: '0.00' },
    ...variants.map(v => ({ variant: v.label, avg_ms: v.stats.avg.toFixed(3), min_ms: v.stats.min.toFixed(3), p50_ms: v.stats.p50.toFixed(3), p90_ms: v.stats.p90.toFixed(3), max_ms: v.stats.max.toFixed(3), improvement_pct: v.improvement.toFixed(2) }))
  ]
  console.table(tableRows)

  if (!KEEP_INDEX) {
    for (const c of CANDIDATE_INDEXES) {
      await dropIndexIfExists(c.name)
    }
    console.log('Temporary indexes dropped (use --keep-index to persist the last created index).')
  }
}

main()
  .catch((err) => {
    console.error('Benchmark failed:', err)
    process.exitCode = 1
  })
  .finally(async () => {
    await prisma.$disconnect()
  })

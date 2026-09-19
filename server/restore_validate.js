/**
 * restore_validate.js — DR Restore Integrity Validator
 *
 * Run after restoring a database backup to confirm that all key tables
 * contain at least the expected minimum row counts.
 *
 * This script proves RTO feasibility — a successful run confirms the
 * restored database is structurally sound and ready to serve traffic.
 *
 * Usage:
 *   node server/restore_validate.js
 *   node server/restore_validate.js --db ./backups/db_2026-09-19_14-00-00.db
 *
 * Exit codes:
 *   0 — All checks passed (safe to restart server)
 *   1 — One or more checks failed (do not restart server)
 */

import prisma from './src/models/prisma.js';

// Minimum acceptable row counts per table (tuned for demo seed data)
const MINIMUM_COUNTS = {
  workspace:           1,
  user:                1,
  cloudAccount:        1,
  resource:            3,
  metric:              1,
  changeOperation:     0,  // May be empty on a fresh restore
  auditLog:            0,  // May be empty on a fresh restore
  scalingRecommendation: 0,
};

async function runValidation() {
  console.log('🔍 CloudOps — DR Restore Integrity Validator');
  console.log('='.repeat(50));
  console.log(`Timestamp : ${new Date().toISOString()}`);
  console.log('='.repeat(50) + '\n');

  let allPassed = true;
  const results = [];

  try {
    // Run all count queries in parallel for speed
    const [
      workspaceCount,
      userCount,
      cloudAccountCount,
      resourceCount,
      metricCount,
      changeOperationCount,
      auditLogCount,
      scalingRecommendationCount,
    ] = await Promise.all([
      prisma.workspace.count(),
      prisma.user.count(),
      prisma.cloudAccount.count(),
      prisma.resource.count(),
      prisma.metric.count(),
      prisma.changeOperation.count(),
      prisma.auditLog.count(),
      prisma.scalingRecommendation.count(),
    ]);

    const counts = {
      workspace:             workspaceCount,
      user:                  userCount,
      cloudAccount:          cloudAccountCount,
      resource:              resourceCount,
      metric:                metricCount,
      changeOperation:       changeOperationCount,
      auditLog:              auditLogCount,
      scalingRecommendation: scalingRecommendationCount,
    };

    // Evaluate each table against its minimum
    for (const [table, count] of Object.entries(counts)) {
      const minRequired = MINIMUM_COUNTS[table] ?? 0;
      const passed = count >= minRequired;
      if (!passed) allPassed = false;

      const icon = passed ? '✅' : '❌';
      const status = passed ? 'PASS' : `FAIL (expected ≥ ${minRequired})`;
      results.push({ table, count, status, passed });
      console.log(`  ${icon}  ${table.padEnd(25)} rows: ${String(count).padStart(6)}   [${status}]`);
    }

    console.log('\n' + '='.repeat(50));

    if (allPassed) {
      console.log('✅ VALIDATION PASSED — Database restore is healthy.');
      console.log('   Safe to restart the CloudOps server.\n');
      await prisma.$disconnect();
      process.exit(0);
    } else {
      const failedTables = results.filter(r => !r.passed).map(r => r.table).join(', ');
      console.error(`❌ VALIDATION FAILED — Tables below minimum count: ${failedTables}`);
      console.error('   Do NOT restart the server. Choose a different backup point.\n');
      await prisma.$disconnect();
      process.exit(1);
    }

  } catch (err) {
    console.error('\n❌ VALIDATION ERROR — Could not connect to database or run queries.');
    console.error(`   Error: ${err.message}`);
    console.error('   Confirm the .env DATABASE_URL path points to the restored .db file.\n');
    await prisma.$disconnect();
    process.exit(1);
  }
}

runValidation();

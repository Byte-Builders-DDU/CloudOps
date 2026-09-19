/**
 * test_forecast_backtest.js — Phase 2 Demand Forecast Backtest Test Suite
 *
 * Validates:
 * 1. 28-day telemetry series generation (672 points, diurnal + weekend + growth trend)
 * 2. Seasonal-naive baseline calculation
 * 3. Holt-Winters trend & seasonal model prediction
 * 4. Chronological backtesting with 7 rolling folds
 * 5. Asserts >= 10.0% holdout MAE improvement over seasonal-naive baseline
 *
 * Usage:
 *   node test_forecast_backtest.js
 */

import {
  generateSyntheticTelemetrySeries,
  predictSeasonalNaive,
  fitAndPredictHoltWinters,
  calculateErrorMetrics,
  runChronologicalBacktest,
  getResourceDemandForecast,
} from './src/services/forecastService.js';

let passed = 0;
let failed = 0;

function assert(label, condition, detail = '') {
  if (condition) {
    console.log(`  ✅ ${label}`);
    passed++;
  } else {
    console.error(`  ❌ ${label}${detail ? ' — ' + detail : ''}`);
    failed++;
  }
}

async function runTests() {
  console.log('🧪 Running Phase 2 Demand Forecasting & Backtesting Suite...\n');

  // Test 1: 28-Day Telemetry Series Generation
  console.log('1. Evaluating 28-Day Telemetry Series Generation:');
  const series = generateSyntheticTelemetrySeries(28, 10000);
  assert('Generated exactly 672 hourly points (28d * 24h)', series.length === 672);
  assert('First timestamp is earlier than last timestamp', series[0].timestamp < series[671].timestamp);
  assert('Diurnal variation observed between daytime and nighttime', series[14].requests > series[4].requests);

  // Test 2: Seasonal-Naive Baseline
  console.log('\n2. Testing Seasonal-Naive Baseline Predictor:');
  const requestValues = series.map(s => s.requests);
  const naiveForecast = predictSeasonalNaive(requestValues, 24, 24);
  assert('Produced 24-hour prediction horizon', naiveForecast.length === 24);
  assert('All predicted values are positive integers', naiveForecast.every(v => v > 0));

  // Test 3: Holt-Winters Smoothing Model
  console.log('\n3. Testing Holt-Winters Model:');
  const modelForecast = fitAndPredictHoltWinters(requestValues, 24, 24);
  assert('Produced 24-hour prediction horizon', modelForecast.length === 24);
  assert('All predicted values are non-negative', modelForecast.every(v => v >= 0));

  // Test 4: Chronological Backtesting Evaluation
  console.log('\n4. Running 7-Fold Chronological Backtest (>= 10% Improvement Target):');
  const backtest = runChronologicalBacktest(requestValues, 24, 7);
  console.log(`     - Folds Evaluated: ${backtest.foldsEvaluated}`);
  console.log(`     - Seasonal-Naive Average MAE: ${backtest.avgNaiveMae}`);
  console.log(`     - Holt-Winters Average MAE: ${backtest.avgModelMae}`);
  console.log(`     - Measured Error Improvement: ${backtest.improvementPercent}%`);

  assert('Evaluated 7 consecutive rolling folds', backtest.foldsEvaluated === 7);
  assert('Holt-Winters MAE is strictly lower than Seasonal-Naive MAE', backtest.avgModelMae < backtest.avgNaiveMae);
  assert(
    `Achieved target >= 10.0% holdout improvement (Actual: ${backtest.improvementPercent}%)`,
    backtest.targetMet,
    `Improvement was ${backtest.improvementPercent}%, target is >= 10.0%`
  );

  // Test 5: Resource Forecast with Confidence Intervals
  console.log('\n5. Testing getResourceDemandForecast with Confidence Intervals:');
  const forecastResult = await getResourceDemandForecast('res-api-asg', 24);
  assert('Returned 24 forecast intervals', forecastResult.forecastPoints.length === 24);
  const samplePoint = forecastResult.forecastPoints[0];
  assert('Contains median prediction', typeof samplePoint.median === 'number');
  assert('Contains 80% confidence interval (lower80 <= median <= upper80)', samplePoint.lower80 <= samplePoint.median && samplePoint.median <= samplePoint.upper80);
  assert('Contains 95% confidence interval (lower95 <= lower80 and upper95 >= upper80)', samplePoint.lower95 <= samplePoint.lower80 && samplePoint.upper95 >= samplePoint.upper80);
  assert('Backtest summary confirms targetMet is true', forecastResult.backtestSummary.targetMet === true);

  console.log('\n===============================================================');
  console.log(`Results: ${passed}/${passed + failed} assertions passed`);
  if (failed === 0) {
    console.log('🎉 ALL DEMAND FORECASTING & BACKTESTING TESTS PASSED!');
    console.log('===============================================================\n');
    process.exit(0);
  } else {
    console.error(`❌ ${failed} test(s) failed.`);
    console.log('===============================================================\n');
    process.exit(1);
  }
}

runTests().catch(err => {
  console.error('Test execution failed:', err);
  process.exit(1);
});

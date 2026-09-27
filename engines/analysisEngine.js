// =========================
// ANALYSIS ENGINE // V3 MASTER ROUTER
// =========================

// =========================
// NEW SCAN
// =========================
function analyzeNewScanMode(data) {
  const { stockName, timeframe, ltp, ema20, ema50, rsi, advancedEnabled = false, candles = [] } = data;

  // SETUP
  const setupResult = calculateSetupScores({ ltp, ema20, ema50, rsi, timeframe });

  // MOMENTUM
  let momentumResult = { momentumScore: 0, momentumTrend: "Not Available", participationTrend: "Not Available", relativeVolumeStatus: "Not Available", weaknessDetected: false };

  if ( advancedEnabled && candles.length >= 5 ) {
    momentumResult = calculateNewScanMomentum({ candles });
  }

  // VERDICT
  const verdictResult = analyzeNewScan({ timeframe, setup: setupResult.setup, setupScore: setupResult.setupScore, momentumScore: momentumResult.momentumScore, weaknessDetected: momentumResult.weaknessDetected, ltp, ema20, ema50, rsi, advancedEnabled });

  // TRADE PLAN
  const tradePlan = generateTradePlan({ ltp, setup: setupResult.setup });

  // REASONS
  const reasons = generateNewScanReasons({ verdict: verdictResult.verdict, setup: setupResult.setup, setupScore: setupResult.setupScore, momentumScore: momentumResult.momentumScore, momentumTrend: momentumResult.momentumTrend, participationTrend: momentumResult.participationTrend, relativeVolumeStatus: momentumResult.relativeVolumeStatus, weaknessDetected: momentumResult.weaknessDetected, ltp, ema20, ema50, rsi, advancedEnabled });

  return { stockName, mode: "new", timeframe, ...verdictResult, setup: setupResult.setup, setupScore: setupResult.setupScore, cbScore: setupResult.cbPercent, pcScore: setupResult.pcPercent, momentumScore: momentumResult.momentumScore, momentumTrend: momentumResult.momentumTrend, participationTrend: momentumResult.participationTrend, tradePlan, reasons };
}

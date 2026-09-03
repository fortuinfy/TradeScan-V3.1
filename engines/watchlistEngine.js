// =========================
// WATCHLIST ENGINE
// =========================
function analyzeWatchlist(data) {
const {
timeframe,
setup,
setupScore,
momentumScore = 0,
weaknessDetected = false,
ltp,
ema20,
ema50,
rsi,
previousTriggerLow,
previousTriggerHigh,
previousSL,
previousTarget = 0,
advancedEnabled = false
} = data;

// =========================
// CONDITIONS & THRESHOLDS
// =========================
const strongTrend = ltp > ema20 && ema20 > ema50;
const healthyRSI = rsi >= 55 && rsi <= 75;

const insideTriggerZone = ltp >= previousTriggerLow && ltp <= previousTriggerHigh;
const acceptableBreakoutZone = ltp > previousTriggerHigh && ltp <= (previousTriggerHigh * 1.015);
const missedBreakout = ltp > (previousTriggerHigh * 1.015);

const targetExceeded = previousTarget > 0 && ltp >= previousTarget;
const belowStopLoss = ltp < previousSL;

// =========================
// DEFAULTS
// =========================
let verdict = "MONITOR";
let confidence = 65;
let setupGrade = "B";
let riskLevel = "MEDIUM";
let workflowAction = "Continue Watchlist";
const badges = [];

// =========================
// BADGES
// =========================
if (strongTrend) { badges.push("Strong Trend"); }
if (healthyRSI) { badges.push("Healthy RSI"); }
if (insideTriggerZone) { badges.push("Near Trigger Zone"); }
if (acceptableBreakoutZone) { badges.push("Valid Breakout"); }
if (missedBreakout || targetExceeded) { badges.push("Missed Opportunity"); }
if (advancedEnabled && momentumScore >= 80) { badges.push("Momentum Expansion"); }

// =========================
// DAILY BREAKDOWN DEFINITION
// =========================
const isDailyBreakdown = timeframe === "Daily" && (ltp < ema20 || ema20 < ema50 || rsi < 45 || (advancedEnabled && weaknessDetected) || (advancedEnabled && momentumScore < 50));

// =========================
// 1. MISSED (LTP > 1.5% PAST TRIGGER OR PAST TARGET)
// =========================
if (missedBreakout || targetExceeded) {
verdict = "MISSED";
confidence = 0;
setupGrade = "N/A";
riskLevel = "N/A";
workflowAction = "Discard - Target/Entry Missed";
}
// =========================
// 2. REMOVE (STOP LOSS BREACHED OR STRUCTURAL FAILURE)
// Prevent 15-min pullbacks from triggering REMOVE by dropping the generic setupScore < 50 rule
// =========================
else if (belowStopLoss || isDailyBreakdown) {
verdict = "REMOVE";
confidence = 25;
setupGrade = "D";
riskLevel = "HIGH";
workflowAction = "Remove From Watchlist";
}
// =========================
// 3. READY (ORIGINAL ENTRY ZONE OR UP TO 1.5% ABOVE)
// =========================
else if ((insideTriggerZone || acceptableBreakoutZone) && strongTrend && healthyRSI && (!advancedEnabled || (momentumScore >= 60 && !weaknessDetected))) {
verdict = "READY";
confidence = setupScore >= 90 ? 90 : 85;
setupGrade = setupScore >= 90 ? "A+" : "A";
riskLevel = "LOW";
workflowAction = "Ready For Execution";
}
// =========================
// 4. MONITOR (RESTING BELOW TRIGGER OR NORMAL PULLBACK)
// =========================
else {
verdict = "MONITOR";
confidence = setupScore >= 70 ? 70 : 60;
setupGrade = setupScore >= 70 ? "B" : "C";
riskLevel = "MEDIUM";
workflowAction = "Continue Watchlist";
}

// =========================
// ADVANCED MOMENTUM BOOST
// =========================
if (advancedEnabled && momentumScore >= 80 && verdict === "READY") {
confidence = Math.min(95, confidence + 5);
if (!badges.includes("High Conviction")) {
badges.push("High Conviction");
}
}

// =========================
// RETURN 
// (requiresNewPlan permanently locked to false to bypass Master Router dynamic recalculations)
// =========================
return { verdict, confidence, setupGrade, riskLevel, workflowAction, requiresNewPlan: false, badges };
}

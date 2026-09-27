// =========================
// TRADESCAN V3.1
// PHASE 1 INITIALIZATION
// =========================

// =========================
// CLOCK
// =========================
function updateDateTime() {
  const now = new Date();
  document.getElementById("dateTime").innerText = now.toLocaleString("en-IN");
}
setInterval(updateDateTime, 1000);
updateDateTime();

// =========================
// ADVANCED MOMENTUM (CLEAN SLATE MECHANIC)
// =========================
const advancedToggle = document.getElementById("advancedToggle");
advancedToggle.addEventListener("change", () => {
  document.getElementById("momentumSection").classList.toggle("hidden", !advancedToggle.checked);
  buildMomentumInputs();
  
  // HYGIENE FIX: Clear results and state to prevent data contamination on toggle
  document.getElementById("resultsContainer").innerHTML = "";
  document.getElementById("positionResult").innerHTML = "";
  hidePositionSize();
  window.lastAnalysisResult = null;
  const screenshotContainer = document.getElementById('screenshotContainer');
  if (screenshotContainer) {
    screenshotContainer.classList.add('hidden');
  }
});

// =========================
// CANDLE INPUT BUILDER
// =========================
function buildMomentumInputs() {
  const container = document.getElementById("candlesContainer");
  container.innerHTML = "";
  for (let i = 1; i <= 5; i++) {
    container.innerHTML += `
      <div class="candle-block">
        <h3>Candle ${i}</h3>
        <div class="input-grid">
          <div class="input-group">
            <label>Close Price</label>
            <input type="number" id="close${i}" step="0.01">
          </div>
          <div class="input-group">
            <label>Nature</label>
            <select id="nature${i}">
              <option value="Bullish">Bullish</option>
              <option value="Neutral">Neutral</option>
              <option value="Bearish">Bearish</option>
            </select>
          </div>
          <div class="input-group">
            <label>Volume</label>
            <div style="display: flex; gap: 8px;">
              <input type="number" id="volume${i}" placeholder="1.5" step="0.01" style="width: 60%;">
              <select id="volumeMulti${i}" style="width: 40%;">
                <option value="">-</option>
                <option value="K">K</option>
                <option value="L">L</option>
                <option value="M">M</option>
                <option value="Cr">Cr</option>
                <option value="B">B</option>
                <option value="T">T</option>
              </select>
            </div>
          </div>
        </div>
      </div>`;
  }
}

// =========================
// ANALYZE BUTTON EXECUTION
// =========================
document.getElementById("analyzeBtn").addEventListener("click", runAnalysis);

function runAnalysis() {
  // =========================
  // GATHER CORE INPUTS
  // =========================
  const stockName = document.getElementById("stockName").value.trim();
  const timeframe = document.getElementById("timeframe").value;
  const ltp = safeNumber(document.getElementById("ltp").value);
  const ema20 = safeNumber(document.getElementById("ema20").value);
  const ema50 = safeNumber(document.getElementById("ema50").value);
  const rsi = safeNumber(document.getElementById("rsi").value);
  const advancedEnabled = document.getElementById("advancedToggle").checked;

  // =========================
  // BASIC VALIDATION
  // =========================
  const validation = validateBasicInputs({ stockName, ltp, ema20, ema50, rsi });
  if (!validation.valid) {
    alert(validation.message);
    return;
  }

  // =========================
  // MOMENTUM DATA
  // =========================
  let candles = [];
  if (advancedEnabled) {
    candles = collectCandles();
    const candleValidation = validateCandleInputs(candles);
    if (!candleValidation.valid) {
      alert(candleValidation.message);
      return;
    }
  }

  // =========================
  // EXECUTE ANALYSIS
  // =========================
  let result = analyzeNewScanMode({ stockName, timeframe, ltp, ema20, ema50, rsi, advancedEnabled, candles });

  // =========================
  // DISPLAY
  // =========================
  if (result) {
    result.stockName = stockName !== "" ? stockName : "Unknown Asset";
    result.timeframe = timeframe;
    result.timestamp = new Date().toLocaleString("en-IN");
    
    window.lastAnalysisResult = result;
    renderResults(result);
    
    const screenshotContainer = document.getElementById('screenshotContainer');
    if (screenshotContainer) screenshotContainer.classList.remove('hidden');
  }
}

// =========================
// COLLECT CANDLES (MERGE DATA)
// =========================
function collectCandles() {
  const candles = [];
  for (let i = 1; i <= 5; i++) {
    const volNum = document.getElementById(`volume${i}`).value.trim();
    const volMulti = document.getElementById(`volumeMulti${i}`).value;
    const finalVolume = volNum ? volNum + volMulti : "";
    
    candles.push({
      close: safeNumber(document.getElementById(`close${i}`).value),
      nature: document.getElementById(`nature${i}`).value,
      volume: finalVolume
    });
  }
  return candles;
}

// =========================
// RESULT RENDERER
// =========================
function renderResults(result) {
  const container = document.getElementById("resultsContainer");
  container.innerHTML = "";

  // =========================
  // ANALYSIS OVERVIEW
  // =========================
  container.innerHTML += `
    <div class="card">
      <div class="card-header"><h3>Analysis Overview</h3></div>
      <div class="sub-card-grid">
        <div class="sub-card">
          <h4>Asset</h4>
          <p>${result.stockName}</p>
        </div>
        <div class="sub-card">
          <h4>Timeframe</h4>
          <p>${result.timeframe}</p>
        </div>
        <div class="sub-card">
          <h4>Time Evaluated</h4>
          <p style="font-size: 15px;">${result.timestamp}</p>
        </div>
      </div>
    </div>`;

  // =========================
  // FINAL VERDICT
  // =========================
  container.innerHTML += `
    <div class="card">
      <div class="card-header"><h3>Final Verdict</h3></div>
      <div class="sub-card-grid">
        <div class="sub-card">
          <h4>Verdict</h4>
          <p class="${result.verdict.toLowerCase()}">${result.verdict}</p>
          <span class="workflow-badge">${result.workflowAction}</span>
        </div>
        <div class="sub-card">
          <h4>Confidence</h4>
          <p>${result.confidence}%</p>
        </div>
        <div class="sub-card">
          <h4>Setup Grade</h4>
          <p>${result.setupGrade}</p>
        </div>
      </div>
    </div>`;

  // =========================
  // SETUP ANALYSIS
  // =========================
  container.innerHTML += `
    <div class="card">
      <div class="card-header"><h3>Setup Analysis</h3></div>
      <div class="sub-card-grid">
        <div class="sub-card">
          <h4>Setup</h4>
          <p>${result.setup}</p>
        </div>
        <div class="sub-card">
          <h4>Setup Score</h4>
          <p>${result.setupScore}</p>
        </div>
        <div class="sub-card">
          <h4>Risk Level</h4>
          <p>${result.riskLevel}</p>
        </div>
      </div>
    </div>`;

  if (result.cbScore !== undefined) {
    container.innerHTML += `
      <div class="card">
        <div class="card-header"><h3>Setup Scores</h3></div>
        <div class="sub-card-grid">
          <div class="sub-card">
            <h4>CB Score</h4>
            <p>${result.cbScore}%</p>
          </div>
          <div class="sub-card">
            <h4>PC Score</h4>
            <p>${result.pcScore}%</p>
          </div>
          <div class="sub-card">
            <h4>Dominant Setup</h4>
            <p>${result.setup}</p>
          </div>
        </div>
      </div>`;
  }

  // =========================
  // MOMENTUM ANALYSIS
  // =========================
  if (result.momentumScore !== undefined && result.verdict !== "AVOID") {
    container.innerHTML += `
      <div class="card">
        <div class="card-header"><h3>Momentum Analysis</h3></div>
        <div class="sub-card-grid">
          <div class="sub-card">
            <h4>Momentum Score</h4>
            <p>${result.momentumScore}</p>
          </div>
          <div class="sub-card">
            <h4>Trend Direction</h4>
            <p>${result.momentumTrend || "N/A"}</p>
          </div>
          <div class="sub-card">
            <h4>Participation</h4>
            <p>${result.participationTrend || "N/A"}</p>
          </div>
        </div>
      </div>`;
  }

  // =========================
  // TRADE PLAN
  // =========================
  if (result.tradePlan && result.verdict !== "AVOID") {
    container.innerHTML += `
      <div class="card">
        <div class="card-header"><h3>Trade Plan</h3></div>
        <div class="sub-card-grid">
          <div class="sub-card">
            <h4>Entry Zone</h4>
            <p>${result.tradePlan.triggerLow} - ${result.tradePlan.triggerHigh}</p>
          </div>
          <div class="sub-card">
            <h4>Stop Loss</h4>
            <p>${result.tradePlan.stopLoss}</p>
          </div>
          <div class="sub-card">
            <h4>Target</h4>
            <p>${result.tradePlan.target}</p>
          </div>
        </div>
      </div>`;
  }

  renderReasons(result.reasons, result.badges);
  handlePositionSizeVisibility(result);
}

// =========================
// REASONS CARD
// =========================
function renderReasons(reasons, badges) {
  const container = document.getElementById("resultsContainer");
  if (!reasons || reasons.length === 0) {
    return;
  }

  let html = `
    <div class="card reason-box">
      <div class="card-header"><h3>Analysis Reasons</h3></div>
  `;

  if (badges && badges.length > 0) {
    html += `<div class="badge-container">`;
    badges.forEach(badge => {
      html += `<span class="badge badge-blue">${badge}</span>`;
    });
    html += `</div>`;
  }

  html += `<ul>`;
  reasons.forEach(reason => {
    html += `<li>${reason}</li>`;
  });
  html += `</ul></div>`;

  container.innerHTML += html;
}

// =========================
// POSITION SIZE VISIBILITY
// =========================
function handlePositionSizeVisibility(result) {
  const card = document.getElementById("positionSizeCard");
  if (result.verdict === "BUY") {
    card.classList.remove("hidden");
  } else {
    card.classList.add("hidden");
  }
}

function hidePositionSize() {
  document.getElementById("positionSizeCard").classList.add("hidden");
}

// =========================
// POSITION SIZE BUTTON
// =========================
document.getElementById("calculatePositionBtn").addEventListener("click", calculatePosition);

function calculatePosition() {
  const capital = safeNumber(document.getElementById("capitalInput").value);
  const riskPercent = safeNumber(document.getElementById("riskPercentInput").value);
  const entryPrice = safeNumber(document.getElementById("entryPriceInput").value);

  if (!window.lastAnalysisResult || !window.lastAnalysisResult.tradePlan) {
    alert("Run analysis first.");
    return;
  }

  if (entryPrice <= 0) {
    alert("Please enter a valid Actual Entry Price.");
    return;
  }

  const stopLoss = window.lastAnalysisResult.tradePlan.stopLoss;

  const positionResult = calculatePositionSize({
    capital,
    riskPercent,
    entryPrice: entryPrice,
    stopLoss: stopLoss
  });

  renderPositionResult(positionResult);
}

// =========================
// POSITION RESULT RENDERER
// =========================
function renderPositionResult(result) {
  const container = document.getElementById("positionResult");
  container.innerHTML = `
    <div class="sub-card-grid" style="margin-top: 24px;">
      <div class="sub-card">
        <h4>Suggested Quantity</h4>
        <p>${result.quantity}</p>
      </div>
      <div class="sub-card">
        <h4>Total Risk</h4>
        <p>₹${result.riskAmount}</p>
      </div>
      <div class="sub-card">
        <h4>Position Value</h4>
        <p>₹${result.positionValue}</p>
      </div>
    </div>
  `;
}

// =========================
// APP RESET
// =========================
document.getElementById("resetBtn").addEventListener("click", resetApplication);

function resetApplication() {
  document.querySelectorAll("input").forEach(input => {
    if (input.type === "checkbox") {
      input.checked = false;
    } else {
      input.value = "";
    }
  });

  document.querySelectorAll("select").forEach(select => {
    select.selectedIndex = 0;
  });

  document.getElementById("resultsContainer").innerHTML = "";
  document.getElementById("positionResult").innerHTML = "";
  hidePositionSize();
  document.getElementById("momentumSection").classList.add("hidden");
  buildMomentumInputs();
  window.lastAnalysisResult = null;
  
  const screenshotContainer = document.getElementById('screenshotContainer');
  if (screenshotContainer) {
    screenshotContainer.classList.add('hidden');
  }
}

// =========================
// INITIALIZE & SCREENSHOT
// =========================
window.lastAnalysisResult = null;
buildMomentumInputs();

const scriptHtml2Canvas = document.createElement('script');
scriptHtml2Canvas.src = "https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js";
document.head.appendChild(scriptHtml2Canvas);

setTimeout(() => {
  const screenshotContainer = document.createElement('div');
  screenshotContainer.id = "screenshotContainer";
  screenshotContainer.classList.add("hidden");
  screenshotContainer.style.marginTop = "40px";
  screenshotContainer.style.paddingBottom = "40px";
  screenshotContainer.style.textAlign = "center";
  screenshotContainer.innerHTML = `
    <button id="screenshotBtn" style="background: linear-gradient(135deg, #10b981, #059669); width: 100%; max-width: 350px; margin: 0 auto; display: block; border-radius: 14px; padding: 16px 28px; font-weight: 700; color: white; cursor: pointer; border: none; font-size: 16px; box-shadow: 0 8px 20px rgba(16, 185, 129, 0.35); transition: 0.25s;">
      📸 Grab a Screenshot
    </button>
  `;

  const mainContainer = document.querySelector('.container');
  if (mainContainer) {
    mainContainer.appendChild(screenshotContainer);
  }

  const screenshotBtn = document.getElementById('screenshotBtn');
  if (screenshotBtn) {
    screenshotBtn.addEventListener('click', () => {
      const btnContainer = document.getElementById('screenshotContainer');
      btnContainer.classList.add('hidden');

      document.querySelectorAll('input').forEach(input => {
        if (input.type === 'checkbox' || input.type === 'radio') {
          if (input.checked) input.setAttribute('checked', 'checked');
          else input.removeAttribute('checked');
        } else {
          input.setAttribute('value', input.value);
        }
      });

      document.querySelectorAll('select').forEach(select => {
        const options = Array.from(select.options);
        options.forEach(opt => {
          if (opt.selected) opt.setAttribute('selected', 'selected');
          else opt.removeAttribute('selected');
        });
      });

      setTimeout(() => {
        html2canvas(document.querySelector('.container'), {
          backgroundColor: "#111827",
          scale: window.devicePixelRatio || 2,
          useCORS: true
        }).then(canvas => {
          const imgData = canvas.toDataURL('image/png');
          const link = document.createElement('a');
          link.download = `TradeScan-Result-${new Date().getTime()}.png`;
          link.href = imgData;
          try {
            link.click();
          } catch (e) {
            const win = window.open();
            win.document.write('<img src="' + imgData + '" style="width:100%; height:auto;" />');
          }
          btnContainer.classList.remove('hidden');
        }).catch(err => {
          console.error("Screenshot failed:", err);
          btnContainer.classList.remove('hidden');
        });
      }, 150);
    });
  }
}, 500);

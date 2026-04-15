/* ══════════════════════════════════════════════════════════════════════════
   HW2 App — Main Controller
   ══════════════════════════════════════════════════════════════════════════ */

// DOM refs
const toastEl = document.getElementById('toast');
const trainBtn = document.getElementById('btn-train');
const multiBtn = document.getElementById('btn-multi');
const progressWrapper = document.getElementById('progress-wrapper');
const progressBar = document.getElementById('progress-bar');
const progressText = document.getElementById('progress-text');

function toast(msg) {
    toastEl.textContent = msg;
    toastEl.classList.add('show');
    setTimeout(() => toastEl.classList.remove('show'), 2200);
}

function getParams() {
    return {
        episodes: parseInt(document.getElementById('episodes').value),
        alpha: parseFloat(document.getElementById('alpha').value),
        gamma: parseFloat(document.getElementById('gamma').value),
        epsilon: parseFloat(document.getElementById('epsilon').value),
        numRuns: parseInt(document.getElementById('numRuns').value)
    };
}

// ── Render Environment Grid ──
function renderEnvGrid() {
    const grid = document.getElementById('env-grid');
    grid.innerHTML = '';
    for (let r = 0; r < ROWS; r++) {
        for (let c = 0; c < COLS; c++) {
            const cell = document.createElement('div');
            cell.className = 'env-cell';
            if (r === START[0] && c === START[1]) { cell.classList.add('start'); cell.textContent = 'S'; }
            else if (r === GOAL[0] && c === GOAL[1]) { cell.classList.add('goal'); cell.textContent = 'G'; }
            else if (isCliff(r, c)) { cell.classList.add('cliff'); cell.textContent = '☠'; }
            grid.appendChild(cell);
        }
    }
}

// ── Render Policy Grid ──
function renderPolicyGrid(gridId, Q, label) {
    const grid = document.getElementById(gridId);
    grid.innerHTML = '';
    const policy = extractPolicy(Q);
    const path = tracePath(policy);

    for (let r = 0; r < ROWS; r++) {
        for (let c = 0; c < COLS; c++) {
            const cell = document.createElement('div');
            cell.className = 'env-cell';
            const key = r * COLS + c;

            if (r === START[0] && c === START[1]) {
                cell.classList.add('start');
                cell.textContent = 'S';
                if (path.has(key)) cell.classList.add('on-path');
            } else if (r === GOAL[0] && c === GOAL[1]) {
                cell.classList.add('goal');
                cell.textContent = 'G';
                if (path.has(key)) cell.classList.add('on-path');
            } else if (isCliff(r, c)) {
                cell.classList.add('cliff');
                cell.textContent = '☠';
            } else {
                if (path.has(key)) cell.classList.add('on-path');
                cell.textContent = policy[r][c] >= 0 ? ACTION_ARROWS[policy[r][c]] : '';
            }
            grid.appendChild(cell);
        }
    }
}

// ── Render Heatmap Grid ──
function renderHeatmapGrid(gridId, Q) {
    const grid = document.getElementById(gridId);
    grid.innerHTML = '';
    const vals = getMaxQValues(Q);

    let vMin = Infinity, vMax = -Infinity;
    for (let r = 0; r < ROWS; r++) {
        for (let c = 0; c < COLS; c++) {
            if (isCliff(r, c)) continue;
            if (vals[r][c] < vMin) vMin = vals[r][c];
            if (vals[r][c] > vMax) vMax = vals[r][c];
        }
    }
    const vRange = vMax - vMin || 1;

    for (let r = 0; r < ROWS; r++) {
        for (let c = 0; c < COLS; c++) {
            const cell = document.createElement('div');
            cell.className = 'env-cell';

            if (isCliff(r, c)) {
                cell.classList.add('cliff');
                cell.textContent = '☠';
            } else if (r === GOAL[0] && c === GOAL[1]) {
                cell.classList.add('goal');
                cell.textContent = 'G';
            } else {
                const t = (vals[r][c] - vMin) / vRange;
                const h = 220 - t * 180; // blue → warm
                cell.style.background = `hsla(${h}, 60%, 45%, ${0.2 + t * 0.5})`;
                cell.textContent = vals[r][c].toFixed(1);
                cell.style.color = '#e4e6f0';
            }
            grid.appendChild(cell);
        }
    }
}

// ── Render Analysis ──
function renderAnalysis(qRewards, sRewards, qQ, sQ) {
    const last100 = (arr) => arr.slice(-100);
    const mean = (arr) => arr.reduce((a, b) => a + b, 0) / arr.length;
    const std = (arr) => { const m = mean(arr); return Math.sqrt(arr.reduce((s, v) => s + (v - m) ** 2, 0) / arr.length); };

    const qLast = last100(qRewards), sLast = last100(sRewards);
    const qPath = tracePath(extractPolicy(qQ));
    const sPath = tracePath(extractPolicy(sQ));

    // Find convergence episode (first time moving avg stays above threshold)
    function findConverge(rewards) {
        const ma = movingAverage(rewards, 20);
        const threshold = mean(ma.slice(-50));
        for (let i = 20; i < ma.length; i++) {
            if (Math.abs(ma[i] - threshold) < 15) return i;
        }
        return rewards.length;
    }

    const qConv = findConverge(qRewards), sConv = findConverge(sRewards);

    document.getElementById('analysis-content').innerHTML = `
        <h3>📊 關鍵數據比較</h3>
        <table class="stats-table">
            <thead>
                <tr><th>指標</th><th class="q-color">Q-learning</th><th class="s-color">SARSA</th></tr>
            </thead>
            <tbody>
                <tr><td>全部回合平均獎勵</td><td>${mean(qRewards).toFixed(2)}</td><td>${mean(sRewards).toFixed(2)}</td></tr>
                <tr><td>後100回合平均獎勵</td><td>${mean(qLast).toFixed(2)}</td><td>${mean(sLast).toFixed(2)}</td></tr>
                <tr><td>後100回合標準差</td><td>${std(qLast).toFixed(2)}</td><td>${std(sLast).toFixed(2)}</td></tr>
                <tr><td>最高單回合獎勵</td><td>${Math.max(...qRewards)}</td><td>${Math.max(...sRewards)}</td></tr>
                <tr><td>估計收斂回合</td><td>~${qConv}</td><td>~${sConv}</td></tr>
                <tr><td>最終路徑長度</td><td>${qPath.size} 步</td><td>${sPath.size} 步</td></tr>
                <tr><td>路徑特性</td><td>冒險（沿懸崖）</td><td>安全（遠離懸崖）</td></tr>
            </tbody>
        </table>

        <h3>🔍 理論分析</h3>
        <div class="compare-grid">
            <div class="compare-card">
                <h4 class="q-color">Q-learning（離策略 Off-policy）</h4>
                <p>更新規則使用下一狀態的<strong>最佳可能行動</strong>的 Q 值，即使該行動未被實際執行。</p>
                <div class="highlight-box">
                    Q(s,a) ← Q(s,a) + α[r + γ·<strong>max</strong><sub>a'</sub> Q(s',a') − Q(s,a)]
                </div>
                <p>因此傾向學到<strong>理論最優策略</strong>（最短路徑），但在 ε-greedy 探索下容易墜崖，訓練不穩定。</p>
            </div>
            <div class="compare-card">
                <h4 class="s-color">SARSA（同策略 On-policy）</h4>
                <p>更新規則使用<strong>實際採取的行動</strong>的 Q 值，因此會反映探索策略的影響。</p>
                <div class="highlight-box">
                    Q(s,a) ← Q(s,a) + α[r + γ·Q(s',<strong>a'</strong>) − Q(s,a)]
                </div>
                <p>將探索風險納入考量，學到<strong>較安全的路徑</strong>，遠離懸崖，訓練更穩定。</p>
            </div>
        </div>

        <h3>📌 結論</h3>
        <div class="highlight-box">
            <p><strong>1. 收斂速度：</strong>SARSA 通常收斂較快且穩定，Q-learning 波動較大。</p>
            <p><strong>2. 穩定性：</strong>SARSA 的後期標準差遠小於 Q-learning，學習過程更平滑。</p>
            <p><strong>3. 策略差異：</strong>Q-learning 學到沿懸崖的最短路徑（冒險）；SARSA 學到安全路徑（保守）。</p>
            <p><strong>4. 應用建議：</strong>犯錯代價高 → 選 SARSA；需要理論最優 → 選 Q-learning。</p>
        </div>
    `;
}

// ── Render Stats Table for Multi-run ──
function renderStatsTable(qAll, sAll) {
    const mean = (arr) => arr.reduce((a, b) => a + b, 0) / arr.length;
    const std = (arr) => { const m = mean(arr); return Math.sqrt(arr.reduce((s, v) => s + (v - m) ** 2, 0) / arr.length); };

    const qFinal = qAll.map(r => mean(r.slice(-100)));
    const sFinal = sAll.map(r => mean(r.slice(-100)));

    document.getElementById('stats-table-wrapper').innerHTML = `
        <table class="stats-table">
            <thead>
                <tr><th>統計指標</th><th class="q-color">Q-learning</th><th class="s-color">SARSA</th></tr>
            </thead>
            <tbody>
                <tr><td>各次實驗後100回合均值的平均</td><td>${mean(qFinal).toFixed(2)}</td><td>${mean(sFinal).toFixed(2)}</td></tr>
                <tr><td>各次實驗後100回合均值的標準差</td><td>${std(qFinal).toFixed(2)}</td><td>${std(sFinal).toFixed(2)}</td></tr>
                <tr><td>最佳實驗後100回合均值</td><td>${Math.max(...qFinal).toFixed(2)}</td><td>${Math.max(...sFinal).toFixed(2)}</td></tr>
                <tr><td>最差實驗後100回合均值</td><td>${Math.min(...qFinal).toFixed(2)}</td><td>${Math.min(...sFinal).toFixed(2)}</td></tr>
            </tbody>
        </table>
    `;
}

// ── Training Flow ──
async function runSingleTrain() {
    trainBtn.disabled = true;
    multiBtn.disabled = true;
    progressWrapper.style.display = 'block';

    const p = getParams();
    toast('正在訓練 Q-learning...');
    updateProgress(25);
    await sleep(50);

    const qResult = trainQLearning(p.episodes, p.alpha, p.gamma, p.epsilon);
    updateProgress(50);
    toast('正在訓練 SARSA...');
    await sleep(50);

    const sResult = trainSARSA(p.episodes, p.alpha, p.gamma, p.epsilon);
    updateProgress(75);
    await sleep(50);

    // Draw charts
    drawRewardChart(document.getElementById('reward-chart'), qResult.rewards, sResult.rewards);
    drawStabilityChart(document.getElementById('stability-chart'), qResult.rewards, sResult.rewards);
    document.getElementById('card-reward').style.display = '';

    // Draw policy & heatmap
    renderPolicyGrid('q-policy-grid', qResult.Q);
    renderPolicyGrid('s-policy-grid', sResult.Q);
    renderHeatmapGrid('q-heatmap-grid', qResult.Q);
    renderHeatmapGrid('s-heatmap-grid', sResult.Q);
    document.getElementById('card-policy').style.display = '';

    // Analysis
    renderAnalysis(qResult.rewards, sResult.rewards, qResult.Q, sResult.Q);
    document.getElementById('card-analysis').style.display = '';

    updateProgress(100);
    await sleep(300);
    progressWrapper.style.display = 'none';
    trainBtn.disabled = false;
    multiBtn.disabled = false;
    toast('✅ 訓練完成！');
}

async function runMultiTrain() {
    trainBtn.disabled = true;
    multiBtn.disabled = true;
    progressWrapper.style.display = 'block';

    const p = getParams();
    const qAll = [], sAll = [];

    for (let i = 0; i < p.numRuns; i++) {
        qAll.push(trainQLearning(p.episodes, p.alpha, p.gamma, p.epsilon).rewards);
        sAll.push(trainSARSA(p.episodes, p.alpha, p.gamma, p.epsilon).rewards);
        updateProgress(((i + 1) / p.numRuns) * 90);
        if (i % 5 === 0) { toast(`實驗進度：${i + 1}/${p.numRuns}`); await sleep(10); }
    }

    drawMultiRunChart(document.getElementById('multi-chart'), qAll, sAll);
    renderStatsTable(qAll, sAll);
    document.getElementById('card-multi').style.display = '';

    updateProgress(100);
    await sleep(300);
    progressWrapper.style.display = 'none';
    trainBtn.disabled = false;
    multiBtn.disabled = false;
    toast(`✅ ${p.numRuns} 次實驗完成！`);
}

function updateProgress(pct) {
    progressBar.style.width = pct + '%';
    progressText.textContent = Math.round(pct) + '%';
}

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

// ── Init ──
trainBtn.addEventListener('click', runSingleTrain);
multiBtn.addEventListener('click', runMultiTrain);
window.addEventListener('DOMContentLoaded', renderEnvGrid);

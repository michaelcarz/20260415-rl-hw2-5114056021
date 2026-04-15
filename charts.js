/* ══════════════════════════════════════════════════════════════════════════
   Chart Drawing Utilities (Canvas 2D) — 中文標籤
   ══════════════════════════════════════════════════════════════════════════ */

const COLORS = {
    qRaw: 'rgba(253, 94, 114, 0.15)',
    qLine: '#fd5e72',
    sRaw: 'rgba(116, 185, 255, 0.15)',
    sLine: '#74b9ff',
    grid: 'rgba(255,255,255,0.06)',
    axis: '#8b8fa3',
    title: '#e4e6f0',
    bg: '#242837'
};

function clearCanvas(ctx, w, h) {
    ctx.fillStyle = COLORS.bg;
    ctx.fillRect(0, 0, w, h);
}

function drawGrid(ctx, left, top, w, h, xTicks, yMin, yMax) {
    ctx.strokeStyle = COLORS.grid;
    ctx.lineWidth = 1;
    const ySteps = 5;
    for (let i = 0; i <= ySteps; i++) {
        const y = top + (h / ySteps) * i;
        ctx.beginPath(); ctx.moveTo(left, y); ctx.lineTo(left + w, y); ctx.stroke();
    }
}

function drawAxes(ctx, left, top, w, h, xLabel, yLabel, xMax, yMin, yMax) {
    ctx.fillStyle = COLORS.axis;
    ctx.font = '11px Inter, sans-serif';
    ctx.textAlign = 'center';
    // X axis labels
    const xSteps = 5;
    for (let i = 0; i <= xSteps; i++) {
        const x = left + (w / xSteps) * i;
        ctx.fillText(Math.round(xMax / xSteps * i), x, top + h + 18);
    }
    ctx.fillText(xLabel, left + w / 2, top + h + 35);
    // Y axis labels
    ctx.textAlign = 'right';
    const ySteps = 5;
    for (let i = 0; i <= ySteps; i++) {
        const y = top + (h / ySteps) * i;
        const val = yMax - (yMax - yMin) / ySteps * i;
        ctx.fillText(Math.round(val), left - 8, y + 4);
    }
    ctx.save();
    ctx.translate(left - 45, top + h / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.textAlign = 'center';
    ctx.fillText(yLabel, 0, 0);
    ctx.restore();
}

function drawTitle(ctx, text, x, y) {
    ctx.fillStyle = COLORS.title;
    ctx.font = 'bold 14px Inter, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(text, x, y);
}

function drawLegend(ctx, x, y, items) {
    ctx.font = '11px Inter, sans-serif';
    let cx = x;
    items.forEach(item => {
        ctx.fillStyle = item.color;
        ctx.fillRect(cx, y - 8, 16, 10);
        ctx.fillStyle = COLORS.axis;
        ctx.textAlign = 'left';
        ctx.fillText(item.label, cx + 20, y);
        cx += ctx.measureText(item.label).width + 40;
    });
}

function drawLine(ctx, data, left, top, w, h, yMin, yMax, color, lineWidth) {
    if (!data.length) return;
    ctx.strokeStyle = color;
    ctx.lineWidth = lineWidth || 1.5;
    ctx.beginPath();
    for (let i = 0; i < data.length; i++) {
        const x = left + (i / (data.length - 1)) * w;
        const y = top + h - ((data[i] - yMin) / (yMax - yMin)) * h;
        if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    }
    ctx.stroke();
}

function drawArea(ctx, data, left, top, w, h, yMin, yMax, color) {
    if (!data.length) return;
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(left, top + h);
    for (let i = 0; i < data.length; i++) {
        const x = left + (i / (data.length - 1)) * w;
        const y = top + h - ((data[i] - yMin) / (yMax - yMin)) * h;
        ctx.lineTo(x, y);
    }
    ctx.lineTo(left + w, top + h);
    ctx.closePath();
    ctx.fill();
}

function drawBand(ctx, upper, lower, left, top, w, h, yMin, yMax, color) {
    if (!upper.length) return;
    ctx.fillStyle = color;
    ctx.beginPath();
    for (let i = 0; i < upper.length; i++) {
        const x = left + (i / (upper.length - 1)) * w;
        const y = top + h - ((upper[i] - yMin) / (yMax - yMin)) * h;
        if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    }
    for (let i = lower.length - 1; i >= 0; i--) {
        const x = left + (i / (lower.length - 1)) * w;
        const y = top + h - ((lower[i] - yMin) / (yMax - yMin)) * h;
        ctx.lineTo(x, y);
    }
    ctx.closePath();
    ctx.fill();
}

function drawRewardChart(canvas, qRewards, sRewards) {
    const ctx = canvas.getContext('2d');
    const dpr = window.devicePixelRatio || 1;
    canvas.width = 800 * dpr; canvas.height = 350 * dpr;
    canvas.style.width = '800px'; canvas.style.height = '350px';
    ctx.scale(dpr, dpr);

    clearCanvas(ctx, 800, 350);
    const L = 65, T = 40, W = 700, H = 260;

    const allData = qRewards.concat(sRewards);
    const yMin = Math.min(...allData) * 1.05;
    const yMax = Math.max(0, Math.max(...allData) * 1.1);

    drawGrid(ctx, L, T, W, H, 5, yMin, yMax);
    drawAxes(ctx, L, T, W, H, '回合數 (Episodes)', '累積獎勵', qRewards.length, yMin, yMax);
    drawTitle(ctx, '每回合累積獎勵曲線', 400, 22);

    // raw data as faded area
    drawArea(ctx, qRewards, L, T, W, H, yMin, yMax, COLORS.qRaw);
    drawArea(ctx, sRewards, L, T, W, H, yMin, yMax, COLORS.sRaw);

    // smoothed lines
    const qMA = movingAverage(qRewards, 20);
    const sMA = movingAverage(sRewards, 20);
    drawLine(ctx, qMA, L, T, W, H, yMin, yMax, COLORS.qLine, 2);
    drawLine(ctx, sMA, L, T, W, H, yMin, yMax, COLORS.sLine, 2);

    drawLegend(ctx, L + 10, T + 18, [
        { label: 'Q-learning（滑動平均）', color: COLORS.qLine },
        { label: 'SARSA（滑動平均）', color: COLORS.sLine }
    ]);
}

function drawStabilityChart(canvas, qRewards, sRewards) {
    const ctx = canvas.getContext('2d');
    const dpr = window.devicePixelRatio || 1;
    canvas.width = 800 * dpr; canvas.height = 250 * dpr;
    canvas.style.width = '800px'; canvas.style.height = '250px';
    ctx.scale(dpr, dpr);

    clearCanvas(ctx, 800, 250);
    const L = 65, T = 35, W = 700, H = 170;

    const qStd = movingStd(qRewards, 20);
    const sStd = movingStd(sRewards, 20);
    const yMax = Math.max(...qStd, ...sStd) * 1.1;

    drawGrid(ctx, L, T, W, H, 5, 0, yMax);
    drawAxes(ctx, L, T, W, H, '回合數 (Episodes)', '標準差', qRewards.length, 0, yMax);
    drawTitle(ctx, '學習穩定性分析（滑動標準差）', 400, 20);

    drawLine(ctx, qStd, L, T, W, H, 0, yMax, COLORS.qLine, 2);
    drawLine(ctx, sStd, L, T, W, H, 0, yMax, COLORS.sLine, 2);

    drawLegend(ctx, L + 10, T + 15, [
        { label: 'Q-learning', color: COLORS.qLine },
        { label: 'SARSA', color: COLORS.sLine }
    ]);
}

function drawMultiRunChart(canvas, qAllRewards, sAllRewards) {
    const ctx = canvas.getContext('2d');
    const dpr = window.devicePixelRatio || 1;
    canvas.width = 800 * dpr; canvas.height = 350 * dpr;
    canvas.style.width = '800px'; canvas.style.height = '350px';
    ctx.scale(dpr, dpr);

    clearCanvas(ctx, 800, 350);
    const L = 65, T = 40, W = 700, H = 260;
    const eps = qAllRewards[0].length;

    // compute mean ± std per episode
    function stats(allR) {
        const mean = [], upper = [], lower = [];
        for (let i = 0; i < eps; i++) {
            let sum = 0;
            for (let r = 0; r < allR.length; r++) sum += allR[r][i];
            const m = sum / allR.length;
            let sq = 0;
            for (let r = 0; r < allR.length; r++) sq += (allR[r][i] - m) ** 2;
            const std = Math.sqrt(sq / allR.length);
            mean.push(m); upper.push(m + std); lower.push(m - std);
        }
        return { mean, upper, lower };
    }

    const qS = stats(qAllRewards.map(r => movingAverage(r, 20)));
    const sS = stats(sAllRewards.map(r => movingAverage(r, 20)));

    const allVals = [...qS.upper, ...qS.lower, ...sS.upper, ...sS.lower];
    const yMin = Math.min(...allVals) * 1.05;
    const yMax = Math.max(0, Math.max(...allVals) * 1.1);

    drawGrid(ctx, L, T, W, H, 5, yMin, yMax);
    drawAxes(ctx, L, T, W, H, '回合數 (Episodes)', '累積獎勵', eps, yMin, yMax);
    drawTitle(ctx, `多次獨立實驗統計比較（${qAllRewards.length} 次）`, 400, 22);

    drawBand(ctx, qS.upper, qS.lower, L, T, W, H, yMin, yMax, 'rgba(253,94,114,0.12)');
    drawBand(ctx, sS.upper, sS.lower, L, T, W, H, yMin, yMax, 'rgba(116,185,255,0.12)');
    drawLine(ctx, qS.mean, L, T, W, H, yMin, yMax, COLORS.qLine, 2.5);
    drawLine(ctx, sS.mean, L, T, W, H, yMin, yMax, COLORS.sLine, 2.5);

    drawLegend(ctx, L + 10, T + 18, [
        { label: 'Q-learning（均值 ± σ）', color: COLORS.qLine },
        { label: 'SARSA（均值 ± σ）', color: COLORS.sLine }
    ]);
}

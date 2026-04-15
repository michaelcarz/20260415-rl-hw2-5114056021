/* ══════════════════════════════════════════════════════════════════════════
   Cliff Walking RL Engine — Q-learning & SARSA
   ══════════════════════════════════════════════════════════════════════════ */

const ROWS = 4, COLS = 12;
const START = [3, 0], GOAL = [3, 11];
const ACTIONS = [[- 1, 0], [0, 1], [1, 0], [0, -1]]; // up, right, down, left
const ACTION_ARROWS = ['↑', '→', '↓', '←'];

function isCliff(r, c) { return r === 3 && c >= 1 && c <= 10; }

function step(r, c, actionIdx) {
    let nr = r + ACTIONS[actionIdx][0];
    let nc = c + ACTIONS[actionIdx][1];
    // boundary
    if (nr < 0 || nr >= ROWS || nc < 0 || nc >= COLS) { nr = r; nc = c; }
    // cliff
    if (isCliff(nr, nc)) return { nr: START[0], nc: START[1], reward: -100, done: false };
    // goal
    if (nr === GOAL[0] && nc === GOAL[1]) return { nr, nc, reward: -1, done: true };
    return { nr, nc, reward: -1, done: false };
}

function epsilonGreedy(Q, r, c, epsilon) {
    if (Math.random() < epsilon) return Math.floor(Math.random() * 4);
    let best = 0, bestVal = Q[r][c][0];
    for (let a = 1; a < 4; a++) {
        if (Q[r][c][a] > bestVal) { bestVal = Q[r][c][a]; best = a; }
    }
    return best;
}

function createQ() {
    const Q = [];
    for (let r = 0; r < ROWS; r++) {
        Q[r] = [];
        for (let c = 0; c < COLS; c++) Q[r][c] = [0, 0, 0, 0];
    }
    return Q;
}

function trainQLearning(episodes, alpha, gamma, epsilon) {
    const Q = createQ();
    const rewards = [];
    for (let ep = 0; ep < episodes; ep++) {
        let r = START[0], c = START[1], totalR = 0;
        for (let t = 0; t < 5000; t++) {
            const a = epsilonGreedy(Q, r, c, epsilon);
            const s = step(r, c, a);
            // Q-learning: max over next state
            let maxQ = Q[s.nr][s.nc][0];
            for (let a2 = 1; a2 < 4; a2++) {
                if (Q[s.nr][s.nc][a2] > maxQ) maxQ = Q[s.nr][s.nc][a2];
            }
            Q[r][c][a] += alpha * (s.reward + gamma * maxQ - Q[r][c][a]);
            totalR += s.reward;
            r = s.nr; c = s.nc;
            if (s.done) break;
        }
        rewards.push(totalR);
    }
    return { Q, rewards };
}

function trainSARSA(episodes, alpha, gamma, epsilon) {
    const Q = createQ();
    const rewards = [];
    for (let ep = 0; ep < episodes; ep++) {
        let r = START[0], c = START[1], totalR = 0;
        let a = epsilonGreedy(Q, r, c, epsilon);
        for (let t = 0; t < 5000; t++) {
            const s = step(r, c, a);
            const a2 = s.done ? 0 : epsilonGreedy(Q, s.nr, s.nc, epsilon);
            // SARSA: use actual next action
            const nextQ = s.done ? 0 : Q[s.nr][s.nc][a2];
            Q[r][c][a] += alpha * (s.reward + gamma * nextQ - Q[r][c][a]);
            totalR += s.reward;
            r = s.nr; c = s.nc; a = a2;
            if (s.done) break;
        }
        rewards.push(totalR);
    }
    return { Q, rewards };
}

function extractPolicy(Q) {
    const policy = [];
    for (let r = 0; r < ROWS; r++) {
        policy[r] = [];
        for (let c = 0; c < COLS; c++) {
            if (isCliff(r, c) || (r === GOAL[0] && c === GOAL[1])) { policy[r][c] = -1; continue; }
            let best = 0, bestVal = Q[r][c][0];
            for (let a = 1; a < 4; a++) {
                if (Q[r][c][a] > bestVal) { bestVal = Q[r][c][a]; best = a; }
            }
            policy[r][c] = best;
        }
    }
    return policy;
}

function tracePath(policy) {
    const path = new Set();
    let r = START[0], c = START[1];
    for (let i = 0; i < 50; i++) {
        const key = r * COLS + c;
        if (path.has(key)) break;
        path.add(key);
        if (r === GOAL[0] && c === GOAL[1]) break;
        const a = policy[r][c];
        if (a < 0) break;
        let nr = r + ACTIONS[a][0], nc = c + ACTIONS[a][1];
        if (nr < 0 || nr >= ROWS || nc < 0 || nc >= COLS) break;
        if (isCliff(nr, nc)) break;
        r = nr; c = nc;
    }
    return path;
}

function getMaxQValues(Q) {
    const vals = [];
    for (let r = 0; r < ROWS; r++) {
        vals[r] = [];
        for (let c = 0; c < COLS; c++) {
            vals[r][c] = Math.max(...Q[r][c]);
        }
    }
    return vals;
}

function movingAverage(arr, window) {
    const result = [];
    for (let i = 0; i < arr.length; i++) {
        const start = Math.max(0, i - window + 1);
        let sum = 0;
        for (let j = start; j <= i; j++) sum += arr[j];
        result.push(sum / (i - start + 1));
    }
    return result;
}

function movingStd(arr, window) {
    const ma = movingAverage(arr, window);
    const result = [];
    for (let i = 0; i < arr.length; i++) {
        const start = Math.max(0, i - window + 1);
        let sumSq = 0;
        for (let j = start; j <= i; j++) sumSq += (arr[j] - ma[i]) ** 2;
        result.push(Math.sqrt(sumSq / (i - start + 1)));
    }
    return result;
}

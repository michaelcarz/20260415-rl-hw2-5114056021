# HW2: Q-learning vs SARSA — Cliff Walking

## 概述

實作並比較 Q-learning（Off-policy）與 SARSA（On-policy）在 4×12 Cliff Walking 環境中的表現差異。

## 目標

- 實作 Q-learning 和 SARSA 演算法
- 在相同環境與參數下進行公平比較
- 分析學習表現、策略行為、穩定性
- 建立互動式前端 demo 並部署 GitHub Pages

## 技術決策

- **純前端實作**：所有演算法用 JavaScript 實作，無需後端
- **Canvas 2D 繪圖**：不依賴第三方圖表庫
- **中文標籤**：圖表標題、軸標籤皆為中文
- **Dark Theme**：與 HW1 一致的設計系統

## 結果

| 演算法 | 策略 | 路徑 | 穩定性 |
|--------|------|------|--------|
| Q-learning | 冒險 | 沿懸崖最短路徑 | 波動大 |
| SARSA | 安全 | 遠離懸崖繞行 | 穩定 |

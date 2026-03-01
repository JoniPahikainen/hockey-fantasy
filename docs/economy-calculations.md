# Economy & rating calculations (detailed)

This document describes how base ratings, start prices, and current prices are computed in the hockey fantasy app.

---

## 1. Base Rating

**Purpose:** Measures player strength (40–95).

**Calculation summary:**

* **Goalies:** `save_pct × 100 + wins × 2 − goals_against × 0.5`
* **Defense:** `goals × 3 + assists × 3 + sog × 0.2 + plus_minus × 0.7 + power_play_goals × 1.2`
* **Forwards:** `goals × 4 + assists × 3 + sog × 0.2 + plus_minus × 0.5 + power_play_goals × 1.5`

**Normalize per position:**
`rating = 50 + (score − mean) / stdDev × 10` → clamp 40–95

**Blend current and last season:**

* `weight_current = games_this_season / (games_this_season + 30)`
* `weight_last = 1 − weight_current`
* `base_rating = weight_current × R_current + weight_last × R_last`

---

## 2. Start Price

**Purpose:** Initial player price, based on `base_rating`. Resets at the start of each period.

**Calculation summary:**

* Normalize base_rating per position to 0–1: `normalized = (score − min) / (max − min)`
* Apply price curve:
  `price = floor + (normalized ^ α) × (ceiling − floor)`
* Clamp to floor. α is adjusted so top 2 prices sum to 5.5–6.5 M.

**Floors and ceilings:**

| Parameter        | Value   |
| ---------------- | ------- |
| Floor, goalies   | 1.4 M   |
| Floor, skaters   | 1 M     |
| Ceiling, goalies | 2.2 M   |
| Ceiling, skaters | 3.2 M   |
| α range          | 1.8–2.2 |

---

## 3. Current Price

**Purpose:** Live price updated by performance.

**Key rules:**

* **Start of each period:** Prices reset to `start_price`
* **Performance impact:**

  * 1 point = 1 000 price change
  * Daily change capped at ±250 000
  * Minimum price: 50 000
* **Update timing:** After each scoring period

---

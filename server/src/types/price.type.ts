// ---- Types ----
export interface PricingStructure {
    budget: number;
    rosterSlots: number;
    floorGoalie: number;
    floorSkater: number;
    ceilingGoalie: number;
    ceilingSkater: number;
    eliteTwoSumMin: number;
    eliteTwoSumMax: number;
    alphaMin: number;
    alphaMax: number;
  }
  
  export interface PlayerForPricing {
    player_id: number;
    position: "G" | "D" | "F";
    base_rating: number;
    score?: number;
  }

  export interface PlayerWithNormalized extends PlayerForPricing {
    score: number;
    normalized: number;
  }

  export interface PricedPlayer {
    player_id: number;
    start_price: number;
  }
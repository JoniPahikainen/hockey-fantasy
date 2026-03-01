-- Price history for charting and analytics (system-maintained on price updates)
CREATE TABLE IF NOT EXISTS price_history (
    history_id SERIAL PRIMARY KEY,
    player_id INT NOT NULL REFERENCES players(player_id) ON DELETE CASCADE,
    recorded_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    price INT NOT NULL,
    period_id INT REFERENCES scoring_periods(period_id)
);

CREATE INDEX IF NOT EXISTS idx_price_history_player ON price_history(player_id);
CREATE INDEX IF NOT EXISTS idx_price_history_recorded ON price_history(recorded_at);
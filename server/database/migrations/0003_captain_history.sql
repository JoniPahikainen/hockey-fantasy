CREATE TABLE IF NOT EXISTS captain_history (
    id SERIAL PRIMARY KEY,
    team_id INT NOT NULL REFERENCES fantasy_teams(team_id) ON DELETE CASCADE,
    player_id INT NOT NULL REFERENCES players(player_id) ON DELETE CASCADE,
    from_date TIMESTAMPTZ NOT NULL,
    to_date TIMESTAMPTZ NULL,
    CONSTRAINT ch_to_after_from CHECK (to_date IS NULL OR to_date >= from_date)
);

CREATE INDEX IF NOT EXISTS idx_captain_history_team_dates
    ON captain_history(team_id, from_date, to_date);

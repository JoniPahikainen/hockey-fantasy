-- Captain history: who was captain for each team on which date range.
-- Used to look up "who was captain on date D" for daily points and breakdowns.
CREATE TABLE IF NOT EXISTS captain_history (
    id SERIAL PRIMARY KEY,
    team_id INT NOT NULL REFERENCES fantasy_teams(team_id) ON DELETE CASCADE,
    player_id INT NOT NULL REFERENCES players(player_id) ON DELETE CASCADE,
    from_date DATE NOT NULL,
    to_date DATE NULL,
    CONSTRAINT ch_to_after_from CHECK (to_date IS NULL OR to_date >= from_date)
);

CREATE INDEX IF NOT EXISTS idx_captain_history_team_dates
    ON captain_history(team_id, from_date, to_date);

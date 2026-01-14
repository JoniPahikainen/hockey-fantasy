-- 1. Real fantasy_teams (Created first so others can reference it)
CREATE TABLE IF NOT EXISTS real_teams (
    abbreviation VARCHAR(10) PRIMARY KEY,
    team_id INT UNIQUE,
    full_name VARCHAR(100),
    primary_color VARCHAR(7),
    logo_url TEXT
);

-- 2. User Management
CREATE TABLE IF NOT EXISTS users (
    user_id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 3. Players
CREATE TABLE IF NOT EXISTS players (
    player_id SERIAL PRIMARY KEY,
    api_id INT UNIQUE,
    first_name VARCHAR(50),
    last_name VARCHAR(50),
    position VARCHAR(2) CHECK (position IN ('G', 'D', 'F')),
    team_abbrev VARCHAR(10) REFERENCES real_teams(abbreviation),
    current_price INT NOT NULL,
    is_injured BOOLEAN DEFAULT false
);

-- 4. User fantasy_teams
CREATE TABLE IF NOT EXISTS fantasy_teams (
    team_id SERIAL PRIMARY KEY,
    user_id INT REFERENCES users(user_id) ON DELETE CASCADE,
    team_name VARCHAR(50) NOT NULL,
    budget_remaining INT DEFAULT 2000000,
    trades_remaining INT DEFAULT 16,
    total_points NUMERIC(10, 2) DEFAULT 0,
    is_paid BOOLEAN DEFAULT false,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 5. Matches (Real NHL Schedule)
CREATE TABLE IF NOT EXISTS matches (
    api_id INT UNIQUE,
    match_id SERIAL PRIMARY KEY,
    scheduled_at TIMESTAMP,
    home_team_abbrev VARCHAR(10) REFERENCES real_teams(abbreviation),
    away_team_abbrev VARCHAR(10) REFERENCES real_teams(abbreviation),
    home_score INT DEFAULT 0,
    away_score INT DEFAULT 0,
    is_processed BOOLEAN DEFAULT false
);

-- 6. Player Performance (Stats per Match)
CREATE TABLE IF NOT EXISTS player_game_stats (
    stat_id SERIAL PRIMARY KEY,
    player_id INT REFERENCES players(player_id) ON DELETE CASCADE,
    match_id INT REFERENCES matches(match_id) ON DELETE CASCADE,
    goals INT DEFAULT 0,
    assists INT DEFAULT 0,
    saves INT DEFAULT 0,
    points_earned NUMERIC(6, 2) DEFAULT 0,
    price_change INT DEFAULT 0,
    is_processed BOOLEAN DEFAULT false,
    CONSTRAINT unique_player_match UNIQUE (player_id, match_id)
);

-- 7. Current Active Roster
CREATE TABLE IF NOT EXISTS fantasy_team_players (
    team_id INT REFERENCES fantasy_teams(team_id) ON DELETE CASCADE,
    player_id INT REFERENCES players(player_id) ON DELETE CASCADE,
    is_captain BOOLEAN DEFAULT false,
    PRIMARY KEY (team_id, player_id),
    added_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT true
);

-- 8. Roster History (For calculating points on specific dates)
CREATE TABLE IF NOT EXISTS roster_history (
    history_id SERIAL PRIMARY KEY,
    team_id INT REFERENCES fantasy_teams(team_id) ON DELETE CASCADE,
    player_id INT REFERENCES players(player_id) ON DELETE CASCADE,
    game_date DATE NOT NULL,
    is_captain BOOLEAN DEFAULT false,
    UNIQUE(team_id, player_id, game_date)
);

-- 9. Trade Log
CREATE TABLE IF NOT EXISTS trade_history (
    trade_id SERIAL PRIMARY KEY,
    team_id INT REFERENCES fantasy_teams(team_id) ON DELETE CASCADE,
    player_out_id INT REFERENCES players(player_id) ON DELETE CASCADE,
    player_in_id INT REFERENCES players(player_id) ON DELETE CASCADE,
    trade_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    price_at_trade INT
);

-- 10. Private Leagues
CREATE TABLE IF NOT EXISTS leagues (
    league_id SERIAL PRIMARY KEY,
    name VARCHAR(50) NOT NULL,
    passcode VARCHAR(20),
    creator_id INT REFERENCES users(user_id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS league_members (
    league_id INT REFERENCES leagues(league_id) ON DELETE CASCADE,
    team_id INT REFERENCES fantasy_teams(team_id) ON DELETE CASCADE,
    PRIMARY KEY (league_id, team_id)
);

-- 11. User Settings
CREATE TABLE IF NOT EXISTS settings (
    user_id INT PRIMARY KEY REFERENCES users(user_id) ON DELETE CASCADE,
    email_notifications BOOLEAN DEFAULT true,
    dark_mode BOOLEAN DEFAULT false
);

-- 12. Scoring System
CREATE TABLE IF NOT EXISTS scoring_periods (
    period_id SERIAL PRIMARY KEY,
    period_name VARCHAR(50),
    start_date DATE NOT NULL,
    end_date DATE NOT NULL
);

--- 13. Scoring Rules
CREATE TABLE IF NOT EXISTS scoring_rules (
    rule_key TEXT PRIMARY KEY,
    goalie NUMERIC,
    defense NUMERIC,
    forward NUMERIC
);

--- 14. Goalie Specific Scoring
CREATE TABLE IF NOT EXISTS goalie_save_points (
    min_saves INT,
    max_saves INT,
    points INT
);
--- 15. Goalie Goals Against Penalties
CREATE TABLE IF NOT EXISTS goalie_goals_against_penalty (
    goals_against INT PRIMARY KEY,
    points INT
);


-- Initial Data Insertion for Scoring Rules
INSERT INTO scoring_rules VALUES
('WIN', 4, 4, 4),
('LOSS', -2, -2, -2),
('GOAL', 25, 9, 7),
('ASSIST', 10, 6, 4),
('ZEROGOALS', 15, 0, 0),
('CAPTAIN_MULTIPLIER', 1.3, 1.3, 1.3);

INSERT INTO goalie_save_points VALUES
(1,4,1),(5,9,3),(10,14,5),(15,19,7),(20,24,9),
(25,29,11),(30,34,13),(35,39,16),(40,44,19),
(45,49,22),(50,54,25),(55,59,28),(60,64,31),
(65,69,34),(70,74,37),(75,79,40),(80,84,43),
(85,89,46),(90,94,49),(95,99,52),(100,1000,55);

INSERT INTO goalie_goals_against_penalty VALUES
(1,-1),(2,-2),(3,-3),(4,-4),(5,-6),(6,-8),(7,-10),
(8,-12),(9,-14),(10,-16),(11,-18),(12,-20),(13,-22),(14,-24),(15,-26),
(16,-28),(17,-30),(18,-32),(19,-34),(20,-36);



-- Regular season periods
INSERT INTO scoring_periods (period_name, start_date, end_date) VALUES
('Period 1', '2025-10-07', '2025-11-15'),
('Period 2', '2025-11-16', '2025-12-31'),
('Period 3', '2026-01-01', '2026-02-15'),
('Period 4', '2026-02-16', '2026-03-31');

-- Playoffs period (5th)
INSERT INTO scoring_periods (period_name, start_date, end_date) VALUES
('Playoffs', '2026-04-01', '2026-05-31');



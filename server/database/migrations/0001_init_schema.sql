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
    
    -- Core Skater Stats
    goals INT DEFAULT 0,
    assists INT DEFAULT 0,
    plus_minus INT DEFAULT 0,
    sog INT DEFAULT 0, -- Shots on Goal
    
    -- Advanced Skater Stats
    pim INT DEFAULT 0, -- Penalty Minutes
    hits INT DEFAULT 0,
    blocked_shots INT DEFAULT 0,
    shifts INT DEFAULT 0,
    giveaways INT DEFAULT 0,
    takeaways INT DEFAULT 0,
    power_play_goals INT DEFAULT 0,
    
    -- Goalie Specific
    saves INT DEFAULT 0,
    goals_against INT DEFAULT 0,
    shots_against INT DEFAULT 0,
    is_starter BOOLEAN DEFAULT false,
    is_shutout BOOLEAN DEFAULT false,
    
    -- Time Tracking
    toi_seconds INT DEFAULT 0, -- Store "10:05" as 605 seconds
    
    -- System Columns
    points_earned NUMERIC(6, 2) DEFAULT 0,
    is_win BOOLEAN DEFAULT false,
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
    passcode VARCHAR(60),
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
('WIN', 20, 20, 20),
('LOSS', -10, -10, -10),

('GOAL', 150, 45, 35),
('ASSIST', 75, 30, 20),

('SHUTOUT', 75, 0, 0),

('SHOT_ON_GOAL', 0, 3, 2),
('BLOCKED_SHOT', 0, 4, 3),
('HIT', 0, 2, 1),
('TAKEAWAY', 0, 3, 3),
('GIVEAWAY', 0, -3, -3),

('PIM', -3, -3, -3),
('MINOR_PENALTY', -5, -5, -5),
('MAJOR_PENALTY', -15, -15, -15),
('GAME_MISCONDUCT', -30, -30, -30),

('CAPTAIN_MULTIPLIER', 1.3, 1.3, 1.3);

INSERT INTO goalie_save_points VALUES
(20,24,45),(25,29,55),(30,34,65),(35,39,80),
(40,44,95),(45,49,110),(50,54,125),(55,59,140),
(60,64,155),(65,69,170),(70,74,185),(75,79,200),
(80,84,215),(85,89,230),(90,94,245),(95,99,260),
(100,1000,275);

INSERT INTO goalie_goals_against_penalty VALUES
(1,-5),(2,-10),(3,-15),(4,-20),(5,-30),
(6,-40),(7,-50),(8,-60),(9,-70),(10,-80),
(11,-90),(12,-100),(13,-110),(14,-120),
(15,-130),(16,-140),(17,-150),(18,-160),
(19,-170),(20,-180);


-- Regular season periods
INSERT INTO scoring_periods (period_name, start_date, end_date) VALUES
('Period 1', '2025-10-07', '2025-11-15'),
('Period 2', '2025-11-16', '2025-12-31'),
('Period 3', '2026-01-01', '2026-02-15'),
('Period 4', '2026-02-16', '2026-03-31');

-- Playoffs period (5th)
INSERT INTO scoring_periods (period_name, start_date, end_date) VALUES
('Playoffs', '2026-04-01', '2026-05-31');



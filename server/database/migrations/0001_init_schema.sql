-- 1. Real Teams (Created first so others can reference it)
CREATE TABLE IF NOT EXISTS real_teams (
    abbreviation VARCHAR(10) PRIMARY KEY, -- 'EDM', 'TOR'
    team_id INT UNIQUE,
    full_name VARCHAR(100),
    primary_color VARCHAR(7), -- e.g. '#FF4C00'
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
    current_price INT NOT NULL, -- The current "Salary" cost
    is_injured BOOLEAN DEFAULT false
);

-- 4. User Teams
CREATE TABLE IF NOT EXISTS teams (
    team_id SERIAL PRIMARY KEY,
    user_id INT REFERENCES users(user_id) ON DELETE CASCADE,
    team_name VARCHAR(50) NOT NULL,
    budget_remaining INT DEFAULT 2000000,
    trades_remaining INT DEFAULT 16,
    total_points NUMERIC(10, 2) DEFAULT 0, -- Numeric for decimals
    is_paid BOOLEAN DEFAULT false
);

-- 5. Matches (Real NHL Schedule)
CREATE TABLE IF NOT EXISTS matches (
    match_id SERIAL PRIMARY KEY,
    match_date TIMESTAMP NOT NULL,
    home_team VARCHAR(10) REFERENCES real_teams(abbreviation),
    away_team VARCHAR(10) REFERENCES real_teams(abbreviation),
    home_score INT DEFAULT 0,
    away_score INT DEFAULT 0
);

-- 6. Player Performance (Stats per Match)
CREATE TABLE IF NOT EXISTS player_game_stats (
    stat_id SERIAL PRIMARY KEY,
    player_id INT REFERENCES players(player_id) ON DELETE CASCADE,
    match_id INT REFERENCES matches(match_id) ON DELETE CASCADE,
    goals INT DEFAULT 0,
    assists INT DEFAULT 0,
    saves INT DEFAULT 0,
    points_earned NUMERIC(6, 2) DEFAULT 0, -- Fantasy points for this specific game
    price_change INT DEFAULT 0 -- How much the player's value changed after this game
);

-- 7. Current Active Roster
CREATE TABLE IF NOT EXISTS rosters (
    team_id INT REFERENCES teams(team_id) ON DELETE CASCADE,
    player_id INT REFERENCES players(player_id) ON DELETE CASCADE,
    is_captain BOOLEAN DEFAULT false,
    PRIMARY KEY (team_id, player_id)
);

-- 8. Roster History (For calculating points on specific dates)
CREATE TABLE IF NOT EXISTS roster_history (
    history_id SERIAL PRIMARY KEY,
    team_id INT REFERENCES teams(team_id) ON DELETE CASCADE,
    player_id INT REFERENCES players(player_id) ON DELETE CASCADE,
    game_date DATE NOT NULL,
    is_captain BOOLEAN DEFAULT false,
    UNIQUE(team_id, player_id, game_date)
);

-- 9. Trade Log
CREATE TABLE IF NOT EXISTS trade_history (
    trade_id SERIAL PRIMARY KEY,
    team_id INT REFERENCES teams(team_id) ON DELETE CASCADE,
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
    team_id INT REFERENCES teams(team_id) ON DELETE CASCADE,
    PRIMARY KEY (league_id, team_id)
);

-- 11. User Settings
CREATE TABLE IF NOT EXISTS settings (
    user_id INT PRIMARY KEY REFERENCES users(user_id) ON DELETE CASCADE,
    email_notifications BOOLEAN DEFAULT true,
    dark_mode BOOLEAN DEFAULT false
);
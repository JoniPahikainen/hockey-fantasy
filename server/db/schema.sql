-- 1. User Management
CREATE TABLE IF NOT EXISTS users (
    user_id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. Game Seasons/Periods
CREATE TABLE IF NOT EXISTS periods (
    period_id SERIAL PRIMARY KEY,
    name VARCHAR(100),
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    is_active BOOLEAN DEFAULT true
);

-- 3. Players
CREATE TABLE IF NOT EXISTS players (
    player_id SERIAL PRIMARY KEY,
    api_id INT UNIQUE,
    first_name VARCHAR(50),
    last_name VARCHAR(50),
    position VARCHAR(2) CHECK (position IN ('G', 'D', 'F')),
    real_team VARCHAR(10),
    default_price INT NOT NULL,
    is_injured BOOLEAN DEFAULT false
);

-- 4. Period-specific player prices (used for trades, budgets)
CREATE TABLE IF NOT EXISTS player_prices (
    period_id INT NOT NULL REFERENCES periods(period_id) ON DELETE CASCADE,
    player_id INT NOT NULL REFERENCES players(player_id) ON DELETE CASCADE,
    price INT NOT NULL,
    PRIMARY KEY (period_id, player_id)
);

-- 5. Player price changes per game (performance)
CREATE TABLE IF NOT EXISTS player_daily_price_change (
    stat_id SERIAL PRIMARY KEY,
    period_id INT NOT NULL REFERENCES periods(period_id) ON DELETE CASCADE,
    player_id INT NOT NULL REFERENCES players(player_id) ON DELETE CASCADE,
    game_date DATE NOT NULL,
    goals INT DEFAULT 0,
    assists INT DEFAULT 0,
    saves INT DEFAULT 0,
    points_earned INT DEFAULT 0, 
    price_change INT DEFAULT 0 
);

-- 6. User Teams
CREATE TABLE IF NOT EXISTS teams (
    team_id SERIAL PRIMARY KEY,
    user_id INT REFERENCES users(user_id) ON DELETE CASCADE,
    period_id INT REFERENCES periods(period_id) ON DELETE CASCADE,
    team_name VARCHAR(50) NOT NULL,
    budget_remaining INT DEFAULT 2000000,
    trades_remaining INT DEFAULT 16,
    total_points INT DEFAULT 0,
    is_paid BOOLEAN DEFAULT false
);

-- 7. Current Active Roster
CREATE TABLE IF NOT EXISTS rosters (
    team_id INT REFERENCES teams(team_id) ON DELETE CASCADE,
    player_id INT REFERENCES players(player_id) ON DELETE CASCADE,
    is_captain BOOLEAN DEFAULT false,
    PRIMARY KEY (team_id, player_id)
);

-- 8. Roster History
CREATE TABLE IF NOT EXISTS roster_history (
    history_id SERIAL PRIMARY KEY,
    team_id INT REFERENCES teams(team_id) ON DELETE CASCADE,
    player_id INT REFERENCES players(player_id) ON DELETE CASCADE,
    game_date DATE NOT NULL,
    is_captain BOOLEAN DEFAULT false,
    UNIQUE(team_id, player_id, game_date)
);

-- 9. Trade Log (Audit trail)
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

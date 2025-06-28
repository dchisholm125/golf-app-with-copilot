-- users table
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    auth0_id VARCHAR(255) UNIQUE -- Auth0 user_id for reliable mapping
    -- Optionally: avatar_url VARCHAR(255)
);

-- games table
CREATE TYPE game_type_enum AS ENUM ('wolf', 'skins', 'sixsixsix');
CREATE TABLE games (
    id SERIAL PRIMARY KEY,
    game_type game_type_enum NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    current_hole INT DEFAULT 0,
    num_holes INT DEFAULT 18, -- Number of holes for the game (9 or 18)
    state_json JSONB DEFAULT NULL,
    is_complete BOOLEAN DEFAULT FALSE,
    completed_at TIMESTAMP DEFAULT NULL,
    skin_value NUMERIC(10,2) DEFAULT NULL
    -- Optionally: status VARCHAR(50), created_by INT, FOREIGN KEY (created_by) REFERENCES users(id)
);

-- game_players table
CREATE TABLE game_players (
    id SERIAL PRIMARY KEY,
    game_id INT NOT NULL,
    user_id INT, -- Internal DB user id
    auth0_id VARCHAR(255), -- Auth0 user_id for direct mapping
    name VARCHAR(100) NOT NULL,
    email VARCHAR(255) NOT NULL,
    -- Optionally: team VARCHAR(50), player_order INT
    FOREIGN KEY (game_id) REFERENCES games(id),
    FOREIGN KEY (user_id) REFERENCES users(id)
);

-- achievements definition table
CREATE TABLE achievements (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT NOT NULL,
    icon VARCHAR(50) DEFAULT 'trophy',
    category VARCHAR(50) NOT NULL, -- 'scoring', 'games', 'social', 'milestones'
    points INT DEFAULT 10, -- achievement points for gamification
    is_secret BOOLEAN DEFAULT FALSE, -- hidden until unlocked
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- user achievements tracking
CREATE TABLE user_achievements (
    id SERIAL PRIMARY KEY,
    user_id INT NOT NULL,
    achievement_id INT NOT NULL,
    unlocked_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    game_id INT, -- optional: which game triggered this achievement
    progress_data JSONB DEFAULT NULL, -- for tracking progress on multi-step achievements
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (achievement_id) REFERENCES achievements(id),
    FOREIGN KEY (game_id) REFERENCES games(id),
    UNIQUE(user_id, achievement_id) -- prevent duplicate achievements
);

-- leaderboard cache table for performance
CREATE TABLE leaderboard_cache (
    id SERIAL PRIMARY KEY,
    leaderboard_type VARCHAR(50) NOT NULL, -- 'weekly', 'monthly', 'all_time'
    game_type VARCHAR(50), -- null for overall, specific for game type leaderboards
    period_start DATE,
    period_end DATE,
    user_id INT NOT NULL,
    user_name VARCHAR(100) NOT NULL,
    rank INT NOT NULL,
    score_data JSONB NOT NULL, -- games_won, total_games, win_rate, etc.
    last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
);

-- indexes for performance
CREATE INDEX idx_user_achievements_user_id ON user_achievements(user_id);
CREATE INDEX idx_user_achievements_achievement_id ON user_achievements(achievement_id);
CREATE INDEX idx_leaderboard_cache_type_period ON leaderboard_cache(leaderboard_type, period_start, period_end);
CREATE INDEX idx_leaderboard_cache_game_type ON leaderboard_cache(game_type);
CREATE INDEX idx_games_completed_at ON games(completed_at) WHERE is_complete = true;
CREATE INDEX idx_game_players_user_id ON game_players(user_id);

-- users table
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE
    -- Optionally: auth0_id VARCHAR(255), avatar_url VARCHAR(255)
);

-- games table
CREATE TYPE game_type_enum AS ENUM ('wolf', 'skins', 'sixsixsix');
CREATE TABLE games (
    id SERIAL PRIMARY KEY,
    game_type game_type_enum NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    current_hole INT DEFAULT 0,
    state_json JSONB DEFAULT NULL,
    is_complete BOOLEAN DEFAULT FALSE
    -- Optionally: status VARCHAR(50), created_by INT, FOREIGN KEY (created_by) REFERENCES users(id)
);

-- game_players table
CREATE TABLE game_players (
    id SERIAL PRIMARY KEY,
    game_id INT NOT NULL,
    user_id INT,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(255) NOT NULL,
    -- Optionally: team VARCHAR(50), player_order INT
    FOREIGN KEY (game_id) REFERENCES games(id),
    FOREIGN KEY (user_id) REFERENCES users(id)
);

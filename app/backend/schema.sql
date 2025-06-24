-- users table
CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE
    -- Optionally: auth0_id VARCHAR(255), avatar_url VARCHAR(255)
);

-- games table
CREATE TABLE games (
    id INT AUTO_INCREMENT PRIMARY KEY,
    game_type ENUM('wolf', 'skins', 'sixsixsix') NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    current_hole INT DEFAULT 0,
    state_json JSON DEFAULT NULL
    -- Optionally: status VARCHAR(50), created_by INT, FOREIGN KEY (created_by) REFERENCES users(id)
);

-- game_players table
CREATE TABLE game_players (
    id INT AUTO_INCREMENT PRIMARY KEY,
    game_id INT NOT NULL,
    user_id INT,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(255) NOT NULL,
    -- Optionally: team VARCHAR(50), player_order INT
    FOREIGN KEY (game_id) REFERENCES games(id),
    FOREIGN KEY (user_id) REFERENCES users(id)
);

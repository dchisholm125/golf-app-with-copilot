-- Development dummy data for testing
-- Run this after creating the schema and achievements data
-- This creates realistic test data for dev@dev.dev user and other dummy users

-- Insert dev user and some dummy users
INSERT INTO users (name, email, auth0_id) VALUES
('Dev User', 'dev@dev.dev', 'auth0|dev_user_123'),
('Alice Johnson', 'alice@example.com', 'auth0|alice_123'),
('Bob Smith', 'bob@example.com', 'auth0|bob_456'),
('Charlie Brown', 'charlie@example.com', 'auth0|charlie_789'),
('Diana Wilson', 'diana@example.com', 'auth0|diana_012')
ON CONFLICT (email) DO NOTHING;

-- Get user IDs for reference
-- Note: These will be used in subsequent inserts

-- Insert completed games (mix of wins and losses for dev user)
INSERT INTO games (game_type, created_at, current_hole, num_holes, is_complete, completed_at, skin_value) VALUES
-- Dev user games (some wins, some losses)
('wolf', '2024-12-01 10:00:00', 18, 18, true, '2024-12-01 12:30:00', NULL),
('skins', '2024-12-02 14:00:00', 18, 18, true, '2024-12-02 16:45:00', 5.00),
('wolf', '2024-12-03 09:30:00', 18, 18, true, '2024-12-03 12:00:00', NULL),
('skins', '2024-12-05 15:00:00', 18, 18, true, '2024-12-05 17:30:00', 10.00),
('wolf', '2024-12-08 11:00:00', 18, 18, true, '2024-12-08 13:45:00', NULL),
('skins', '2024-12-10 13:00:00', 18, 18, true, '2024-12-10 15:30:00', 5.00),
('wolf', '2024-12-12 10:30:00', 18, 18, true, '2024-12-12 13:00:00', NULL),
('skins', '2024-12-15 16:00:00', 18, 18, true, '2024-12-15 18:30:00', 10.00),
('wolf', '2024-12-18 12:00:00', 18, 18, true, '2024-12-18 14:45:00', NULL),
('skins', '2024-12-20 14:30:00', 18, 18, true, '2024-12-20 17:00:00', 5.00),
-- Additional games for other users
('wolf', '2024-12-22 10:00:00', 18, 18, true, '2024-12-22 12:30:00', NULL),
('skins', '2024-12-23 15:00:00', 18, 18, true, '2024-12-23 17:45:00', 10.00);

-- Insert game players for each game
-- Game 1: Dev wins
INSERT INTO game_players (game_id, user_id, auth0_id, name, email) VALUES
(1, 1, 'auth0|dev_user_123', 'Dev User', 'dev@dev.dev'),
(1, 2, 'auth0|alice_123', 'Alice Johnson', 'alice@example.com'),
(1, 3, 'auth0|bob_456', 'Bob Smith', 'bob@example.com');

-- Game 2: Dev wins
INSERT INTO game_players (game_id, user_id, auth0_id, name, email) VALUES
(2, 1, 'auth0|dev_user_123', 'Dev User', 'dev@dev.dev'),
(2, 4, 'auth0|charlie_789', 'Charlie Brown', 'charlie@example.com'),
(2, 5, 'auth0|diana_012', 'Diana Wilson', 'diana@example.com');

-- Game 3: Alice wins
INSERT INTO game_players (game_id, user_id, auth0_id, name, email) VALUES
(3, 1, 'auth0|dev_user_123', 'Dev User', 'dev@dev.dev'),
(3, 2, 'auth0|alice_123', 'Alice Johnson', 'alice@example.com'),
(3, 3, 'auth0|bob_456', 'Bob Smith', 'bob@example.com');

-- Game 4: Dev wins
INSERT INTO game_players (game_id, user_id, auth0_id, name, email) VALUES
(4, 1, 'auth0|dev_user_123', 'Dev User', 'dev@dev.dev'),
(4, 2, 'auth0|alice_123', 'Alice Johnson', 'alice@example.com');

-- Game 5: Bob wins
INSERT INTO game_players (game_id, user_id, auth0_id, name, email) VALUES
(5, 1, 'auth0|dev_user_123', 'Dev User', 'dev@dev.dev'),
(5, 3, 'auth0|bob_456', 'Bob Smith', 'bob@example.com'),
(5, 4, 'auth0|charlie_789', 'Charlie Brown', 'charlie@example.com');

-- Game 6: Dev wins
INSERT INTO game_players (game_id, user_id, auth0_id, name, email) VALUES
(6, 1, 'auth0|dev_user_123', 'Dev User', 'dev@dev.dev'),
(6, 5, 'auth0|diana_012', 'Diana Wilson', 'diana@example.com');

-- Game 7: Dev wins
INSERT INTO game_players (game_id, user_id, auth0_id, name, email) VALUES
(7, 1, 'auth0|dev_user_123', 'Dev User', 'dev@dev.dev'),
(7, 2, 'auth0|alice_123', 'Alice Johnson', 'alice@example.com'),
(7, 3, 'auth0|bob_456', 'Bob Smith', 'bob@example.com'),
(7, 4, 'auth0|charlie_789', 'Charlie Brown', 'charlie@example.com');

-- Game 8: Charlie wins
INSERT INTO game_players (game_id, user_id, auth0_id, name, email) VALUES
(8, 1, 'auth0|dev_user_123', 'Dev User', 'dev@dev.dev'),
(8, 4, 'auth0|charlie_789', 'Charlie Brown', 'charlie@example.com');

-- Game 9: Dev wins (hat trick - 3rd win in a row)
INSERT INTO game_players (game_id, user_id, auth0_id, name, email) VALUES
(9, 1, 'auth0|dev_user_123', 'Dev User', 'dev@dev.dev'),
(9, 5, 'auth0|diana_012', 'Diana Wilson', 'diana@example.com');

-- Game 10: Dev wins
INSERT INTO game_players (game_id, user_id, auth0_id, name, email) VALUES
(10, 1, 'auth0|dev_user_123', 'Dev User', 'dev@dev.dev'),
(10, 2, 'auth0|alice_123', 'Alice Johnson', 'alice@example.com');

-- Game 11: Alice wins
INSERT INTO game_players (game_id, user_id, auth0_id, name, email) VALUES
(11, 2, 'auth0|alice_123', 'Alice Johnson', 'alice@example.com'),
(11, 3, 'auth0|bob_456', 'Bob Smith', 'bob@example.com');

-- Game 12: Diana wins
INSERT INTO game_players (game_id, user_id, auth0_id, name, email) VALUES
(12, 4, 'auth0|charlie_789', 'Charlie Brown', 'charlie@example.com'),
(12, 5, 'auth0|diana_012', 'Diana Wilson', 'diana@example.com');

-- Grant achievements to dev user based on the games above
-- Dev user wins: Games 1, 2, 4, 6, 7, 9, 10 (7 wins out of 10 games)
-- Dev user has played with: Alice, Bob, Charlie, Diana (4 different people)
INSERT INTO user_achievements (user_id, achievement_id, unlocked_at, game_id) VALUES
-- Getting Started (Complete first game)
(1, (SELECT id FROM achievements WHERE name = 'Getting Started'), '2024-12-01 12:30:00', 1),
-- First Win
(1, (SELECT id FROM achievements WHERE name = 'First Win'), '2024-12-01 12:30:00', 1),
-- Hat Trick (3 wins in a row: games 7, 9, 10)
(1, (SELECT id FROM achievements WHERE name = 'Hat Trick'), '2024-12-20 17:00:00', 10);

-- Grant some achievements to other users too
INSERT INTO user_achievements (user_id, achievement_id, unlocked_at, game_id) VALUES
-- Alice gets First Win and Getting Started
(2, (SELECT id FROM achievements WHERE name = 'Getting Started'), '2024-12-01 12:30:00', 1),
(2, (SELECT id FROM achievements WHERE name = 'First Win'), '2024-12-03 12:00:00', 3),
-- Bob gets Getting Started and First Win
(3, (SELECT id FROM achievements WHERE name = 'Getting Started'), '2024-12-01 12:30:00', 1),
(3, (SELECT id FROM achievements WHERE name = 'First Win'), '2024-12-08 13:45:00', 5),
-- Charlie gets Getting Started and First Win
(4, (SELECT id FROM achievements WHERE name = 'Getting Started'), '2024-12-02 16:45:00', 2),
(4, (SELECT id FROM achievements WHERE name = 'First Win'), '2024-12-15 18:30:00', 8),
-- Diana gets Getting Started and First Win
(5, (SELECT id FROM achievements WHERE name = 'Getting Started'), '2024-12-02 16:45:00', 2),
(5, (SELECT id FROM achievements WHERE name = 'First Win'), '2024-12-23 17:45:00', 12);

-- Create leaderboard cache entries for testing
-- All-time leaderboard
INSERT INTO leaderboard_cache (leaderboard_type, game_type, user_id, user_name, rank, score_data, last_updated) VALUES
('all_time', NULL, 1, 'Dev User', 1, '{"games_won": 7, "total_games": 10, "win_rate": 70, "total_achievement_points": 60}', CURRENT_TIMESTAMP),
('all_time', NULL, 2, 'Alice Johnson', 2, '{"games_won": 2, "total_games": 5, "win_rate": 40, "total_achievement_points": 15}', CURRENT_TIMESTAMP),
('all_time', NULL, 3, 'Bob Smith', 3, '{"games_won": 1, "total_games": 4, "win_rate": 25, "total_achievement_points": 15}', CURRENT_TIMESTAMP),
('all_time', NULL, 4, 'Charlie Brown', 4, '{"games_won": 1, "total_games": 4, "win_rate": 25, "total_achievement_points": 15}', CURRENT_TIMESTAMP),
('all_time', NULL, 5, 'Diana Wilson', 5, '{"games_won": 1, "total_games": 3, "win_rate": 33, "total_achievement_points": 15}', CURRENT_TIMESTAMP);

-- Wolf-specific leaderboard
INSERT INTO leaderboard_cache (leaderboard_type, game_type, user_id, user_name, rank, score_data, last_updated) VALUES
('all_time', 'wolf', 1, 'Dev User', 1, '{"games_won": 4, "total_games": 5, "win_rate": 80, "total_achievement_points": 60}', CURRENT_TIMESTAMP),
('all_time', 'wolf', 2, 'Alice Johnson', 2, '{"games_won": 1, "total_games": 3, "win_rate": 33, "total_achievement_points": 15}', CURRENT_TIMESTAMP),
('all_time', 'wolf', 3, 'Bob Smith', 3, '{"games_won": 1, "total_games": 3, "win_rate": 33, "total_achievement_points": 15}', CURRENT_TIMESTAMP);

-- Skins-specific leaderboard
INSERT INTO leaderboard_cache (leaderboard_type, game_type, user_id, user_name, rank, score_data, last_updated) VALUES
('all_time', 'skins', 1, 'Dev User', 1, '{"games_won": 3, "total_games": 5, "win_rate": 60, "total_achievement_points": 60}', CURRENT_TIMESTAMP),
('all_time', 'skins', 4, 'Charlie Brown', 2, '{"games_won": 1, "total_games": 1, "win_rate": 100, "total_achievement_points": 15}', CURRENT_TIMESTAMP),
('all_time', 'skins', 5, 'Diana Wilson', 3, '{"games_won": 1, "total_games": 3, "win_rate": 33, "total_achievement_points": 15}', CURRENT_TIMESTAMP);

-- Monthly leaderboard (December 2024)
INSERT INTO leaderboard_cache (leaderboard_type, game_type, period_start, period_end, user_id, user_name, rank, score_data, last_updated) VALUES
('monthly', NULL, '2024-12-01', '2024-12-31', 1, 'Dev User', 1, '{"games_won": 7, "total_games": 10, "win_rate": 70, "total_achievement_points": 60}', CURRENT_TIMESTAMP),
('monthly', NULL, '2024-12-01', '2024-12-31', 2, 'Alice Johnson', 2, '{"games_won": 2, "total_games": 5, "win_rate": 40, "total_achievement_points": 15}', CURRENT_TIMESTAMP),
('monthly', NULL, '2024-12-01', '2024-12-31', 3, 'Bob Smith', 3, '{"games_won": 1, "total_games": 4, "win_rate": 25, "total_achievement_points": 15}', CURRENT_TIMESTAMP);

-- Weekly leaderboard (this week)
INSERT INTO leaderboard_cache (leaderboard_type, game_type, period_start, period_end, user_id, user_name, rank, score_data, last_updated) VALUES
('weekly', NULL, '2024-12-16', '2024-12-22', 1, 'Dev User', 1, '{"games_won": 2, "total_games": 3, "win_rate": 67, "total_achievement_points": 60}', CURRENT_TIMESTAMP),
('weekly', NULL, '2024-12-16', '2024-12-22', 4, 'Charlie Brown', 2, '{"games_won": 1, "total_games": 1, "win_rate": 100, "total_achievement_points": 15}', CURRENT_TIMESTAMP);

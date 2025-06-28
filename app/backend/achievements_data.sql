-- Initial achievements data
-- Run this after creating the schema to populate achievements

INSERT INTO achievements (name, description, icon, category, points, is_secret) VALUES
-- Scoring Achievements
('First Win', 'Win your first game of any type', 'trophy', 'scoring', 10, false),
('Hat Trick', 'Win 3 games in a row', 'fire', 'scoring', 25, false),
('Perfect Storm', 'Win 5 games in a row', 'lightning', 'scoring', 50, false),
('Hole in One', 'Score a hole-in-one (ace)', 'target', 'scoring', 100, false),
('Eagle Eye', 'Score an eagle (-2 strokes)', 'eye', 'scoring', 30, false),
('Birdie Machine', 'Score 5 birdies in a single game', 'bird', 'scoring', 25, false),
('Under Par Master', 'Finish a game under par', 'arrow-down', 'scoring', 20, false),

-- Game Type Achievements  
('Wolf Pack Leader', 'Win 10 Wolf games', 'users', 'games', 30, false),
('Skins Champion', 'Win 10 Skins games', 'dollar-sign', 'games', 30, false),
('Multi-Format Master', 'Win at least 1 game in each format', 'grid', 'games', 40, false),
('Century Club', 'Play 100 total games', 'calendar', 'games', 50, false),

-- Social Achievements
('Team Player', 'Play games with 10 different people', 'handshake', 'social', 35, false),
('Social Butterfly', 'Play games with 25 different people', 'heart', 'social', 60, false),
('Tournament Organizer', 'Create and complete a tournament', 'crown', 'social', 75, false),

-- Milestone Achievements
('Getting Started', 'Complete your first game', 'play-circle', 'milestones', 5, false),
('Dedicated Player', 'Play games on 7 consecutive days', 'calendar-check', 'milestones', 40, false),
('Golf Addict', 'Play games on 30 consecutive days', 'calendar-x', 'milestones', 100, false),

-- Secret/Special Achievements
('Lucky Number', 'Win a game on hole 7 with exactly 77 total strokes', 'clover', 'scoring', 77, true),
('Comeback Kid', 'Win a game after being 5+ strokes behind at the turn', 'refresh-ccw', 'scoring', 50, true),
('Consistency King', 'Play 10 games with scoring variance under 3 strokes', 'target', 'scoring', 60, true);

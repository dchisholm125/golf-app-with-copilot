from fastapi import FastAPI, HTTPException, Body, Path
from pydantic import BaseModel, EmailStr
from typing import List, Optional
import psycopg2
import psycopg2.extras
import os
import logging
from dotenv import load_dotenv
import json
from fastapi.middleware.cors import CORSMiddleware
from collections import defaultdict
from datetime import datetime, timedelta
from datetime import datetime, timedelta

app = FastAPI()

# Middleware for CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://golfleaguegames.netlify.app",  # Production Netlify site
        "http://localhost:5173",                # Local dev
        "https://golf-app-with-copilot.onrender.com"  # (Optional: allow self)
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Load environment variables from .env file
load_dotenv(dotenv_path=os.path.join(os.path.dirname(__file__), '.env'))

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s [%(levelname)s] %(message)s',
)
logger = logging.getLogger(__name__)

# Database connection utility
DATABASE_URL = os.getenv('DATABASE_URL')

def get_db():
    return psycopg2.connect(DATABASE_URL)

# Pydantic models
class PlayerIn(BaseModel):
    name: str
    email: EmailStr
    user_id: Optional[int] = None

class GameCreate(BaseModel):
    game_type: str
    players: List[PlayerIn]
    num_holes: Optional[int] = 18  # Default to 18 holes
    skin_value: Optional[float] = None

class GameStateUpdate(BaseModel):
    current_hole: int
    state_json: dict

class SkinsGameState(BaseModel):
    scores: dict  # {email: [score, ...]}
    skins: list   # [{hole: int, winner: str, carryover: bool, value: int}, ...]
    total_winnings: dict  # {email: amount}

class Achievement(BaseModel):
    id: int
    name: str
    description: str
    icon: str
    category: str
    points: int
    is_secret: bool
    unlocked_at: Optional[str] = None  # Will be set if user has unlocked it

class UserAchievement(BaseModel):
    achievement_id: int
    unlocked_at: str
    progress_data: Optional[dict] = None

class LeaderboardEntry(BaseModel):
    user_id: int
    user_name: str
    rank: int
    games_won: int
    total_games: int
    win_rate: float
    total_points: int

@app.get("/users/by-auth0/{auth0_id}")
def get_user_by_auth0_id(auth0_id: str):
    """
    Returns the internal user record for a given Auth0 user_id.
    """
    db = get_db()
    cursor = db.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
    try:
        cursor.execute("SELECT id, name, email, auth0_id FROM users WHERE auth0_id = %s", (auth0_id,))
        user = cursor.fetchone()
        if not user:
            raise HTTPException(status_code=404, detail="User not found for given Auth0 ID.")
        return user
    finally:
        cursor.close()
        db.close()

@app.post("/games/")
def create_game(game: GameCreate):
    logger.info(f"[POST /games/] Received request to create game: {game}")
    db = get_db()
    cursor = db.cursor()
    try:
        logger.info("Inserting new game into games table")
        # If skins, allow skin_value
        skin_value = getattr(game, 'skin_value', None)
        num_holes = getattr(game, 'num_holes', 18)  # Default to 18 holes
        cursor.execute(
            "INSERT INTO games (game_type, is_complete, state_json, skin_value, num_holes) VALUES (%s, %s, %s, %s, %s) RETURNING id",
            (game.game_type, False, json.dumps({}), skin_value, num_holes)
        )
        game_id = cursor.fetchone()[0]
        logger.info(f"Inserted game with ID: {game_id}")
        # Insert players
        for player in game.players:
            logger.info(f"Processing player: {player}")
            user_id = None
            if hasattr(player, 'auth0_id') and player.auth0_id:
                cursor.execute(
                    "SELECT id FROM users WHERE auth0_id = %s",
                    (player.auth0_id,)
                )
                user_row = cursor.fetchone()
                user_id = user_row[0] if user_row else None
            elif player.email:
                cursor.execute(
                    "SELECT id FROM users WHERE email = %s",
                    (player.email,)
                )
                user_row = cursor.fetchone()
                user_id = user_row[0] if user_row else None
            logger.info(f"Resolved user_id: {user_id} for player: {player}")
            cursor.execute(
                "INSERT INTO game_players (game_id, user_id, auth0_id, name, email) VALUES (%s, %s, %s, %s, %s)",
                (game_id, user_id, getattr(player, 'auth0_id', None), player.name, player.email)
            )
            logger.info(f"Inserted player {player.name} (email: {player.email}) into game_players")
        db.commit()
        logger.info(f"Committed all changes for game ID: {game_id}")
    except Exception as e:
        db.rollback()
        logger.error(f"Error creating game: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="Failed to create game.")
    finally:
        cursor.close()
        db.close()
        logger.info(f"Closed DB connection for game ID: {game_id}")
    return {"game_id": game_id, "message": "Game created successfully"}

@app.patch("/games/{game_id}/state")
def update_game_state(game_id: int, state: GameStateUpdate):
    logger.info(f"[PATCH /games/{game_id}/state] Updating state for game_id={game_id}, state={state}")
    db = get_db()
    cursor = db.cursor()
    try:
        # For skins, validate state_json structure
        cursor.execute("SELECT game_type FROM games WHERE id = %s", (game_id,))
        row = cursor.fetchone()
        if not row:
            raise HTTPException(status_code=404, detail="Game not found.")
        game_type = row[0]
        if game_type == 'skins':
            # Validate state_json for skins
            try:
                SkinsGameState(**state.state_json)
            except Exception as e:
                logger.error(f"Invalid skins state_json: {e}")
                raise HTTPException(status_code=400, detail="Invalid skins state_json")
        cursor.execute(
            "UPDATE games SET current_hole = %s, state_json = %s WHERE id = %s AND is_complete = FALSE",
            (state.current_hole, json.dumps(state.state_json), game_id)
        )
        db.commit()
        if cursor.rowcount == 0:
            logger.warning(f"No rows updated for game_id={game_id}. Game may be complete.")
            raise HTTPException(status_code=400, detail="Cannot update a completed game.")
        logger.info(f"Updated state for game {game_id}")
        return {"message": "Game state updated"}
    except Exception as e:
        db.rollback()
        logger.error(f"Error updating game state: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="Failed to update game state.")
    finally:
        cursor.close()
        db.close()

@app.get("/games/{game_id}/state")
def get_game_state(game_id: int):
    logger.info(f"[GET /games/{game_id}/state] Fetching state for game_id={game_id}")
    db = get_db()
    cursor = db.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
    try:
        cursor.execute("SELECT current_hole, state_json, game_type, is_complete, num_holes FROM games WHERE id = %s", (game_id,))
        row = cursor.fetchone()
        logger.info(f"Fetched row: {row}")
        if not row:
            logger.warning(f"Game not found for game_id={game_id}")
            raise HTTPException(status_code=404, detail="Game not found.")
        state_json = row['state_json']
        if state_json and isinstance(state_json, str):
            state_json = json.loads(state_json)
        return {
            "current_hole": row['current_hole'],
            "state_json": state_json,
            "game_type": row['game_type'],
            "is_complete": row['is_complete'],
            "num_holes": row['num_holes']
        }
    except Exception as e:
        logger.error(f"Error fetching game state: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="Failed to fetch game state.")
    finally:
        cursor.close()
        db.close()

@app.get("/")
def read_root():
    return {"message": "Hello from FastAPI backend!"}

@app.get("/users/{user_key}/games-won")
def get_games_won(user_key: str):
    logger.info(f"[GET /users/{user_key}/games-won] Fetching games won for user_key={user_key}")
    db = get_db()
    cursor = db.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
    try:
        cursor.execute('''
            SELECT g.id, g.game_type, g.current_hole, g.is_complete, g.state_json, g.completed_at, g.created_at,
                   gp.name AS player_name, gp.email AS player_email
            FROM games g
            JOIN game_players gp ON g.id = gp.game_id
            WHERE gp.user_id = %s
            ORDER BY g.completed_at DESC NULLS LAST, g.created_at DESC
        ''', (user_key,))
        games = cursor.fetchall()
        logger.info(f"Fetched {len(games)} games for user_key={user_key}")
        won_games = []
        for game in games:
            logger.debug(f"Processing game: {game['id']}")
            if game['game_type'] == 'wolf' and game['state_json']:
                try:
                    state = game['state_json'] if isinstance(game['state_json'], dict) else json.loads(game['state_json'])
                    points = state.get('points', {})
                    logger.debug(f"Game {game['id']} points: {points}")
                    user_points = sum(points.get(game['player_email'], []))
                    all_scores = [(email, sum(pts)) for email, pts in points.items()]
                    all_scores.sort(key=lambda x: x[1], reverse=True)
                    logger.debug(f"Game {game['id']} all_scores: {all_scores}")
                    if all_scores and all_scores[0][0] == game['player_email']:
                        logger.info(f"User {game['player_email']} won game {game['id']}")
                        won_games.append(game)
                except Exception as e:
                    logger.warning(f"Error parsing state_json for game {game['id']}: {e}", exc_info=True)
            elif game['game_type'] == 'skins' and game['state_json']:
                try:
                    state = game['state_json'] if isinstance(game['state_json'], dict) else json.loads(game['state_json'])
                    winnings = state.get('total_winnings', {})
                    max_won = max(winnings.values()) if winnings else None
                    if winnings and winnings.get(game['player_email'], 0) == max_won:
                        logger.info(f"User {game['player_email']} won skins game {game['id']}")
                        won_games.append(game)
                except Exception as e:
                    logger.warning(f"Error parsing skins state_json for game {game['id']}: {e}", exc_info=True)
        return {"games": won_games}
    except Exception as e:
        logger.error(f"Error fetching games won: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="Failed to fetch games won.")
    finally:
        cursor.close()
        db.close()

@app.get("/users/{user_key}/games-lost")
def get_games_lost(user_key: str):
    logger.info(f"[GET /users/{user_key}/games-lost] Fetching games lost for user_key={user_key}")
    db = get_db()
    cursor = db.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
    try:
        cursor.execute('''
            SELECT g.id, g.game_type, g.current_hole, g.is_complete, g.state_json, g.completed_at, g.created_at,
                   gp.name AS player_name, gp.email AS player_email
            FROM games g
            JOIN game_players gp ON g.id = gp.game_id
            WHERE gp.user_id = %s
            ORDER BY g.completed_at DESC NULLS LAST, g.created_at DESC
        ''', (user_key,))
        games = cursor.fetchall()
        logger.info(f"Fetched {len(games)} games for user_key={user_key}")
        lost_games = []
        for game in games:
            logger.debug(f"Processing game: {game['id']}")
            if game['game_type'] == 'wolf' and game['state_json']:
                try:
                    state = game['state_json'] if isinstance(game['state_json'], dict) else json.loads(game['state_json'])
                    points = state.get('points', {})
                    logger.debug(f"Game {game['id']} points: {points}")
                    user_points = sum(points.get(game['player_email'], []))
                    all_scores = [(email, sum(pts)) for email, pts in points.items()]
                    all_scores.sort(key=lambda x: x[1])  # Ascending
                    logger.debug(f"Game {game['id']} all_scores: {all_scores}")
                    if all_scores and all_scores[0][0] == game['player_email']:
                        logger.info(f"User {game['player_email']} lost game {game['id']}")
                        lost_games.append(game)
                except Exception as e:
                    logger.warning(f"Error parsing state_json for game {game['id']}: {e}", exc_info=True)
            elif game['game_type'] == 'skins' and game['state_json']:
                try:
                    state = game['state_json'] if isinstance(game['state_json'], dict) else json.loads(game['state_json'])
                    winnings = state.get('total_winnings', {})
                    max_won = max(winnings.values()) if winnings else None
                    if winnings and winnings.get(game['player_email'], 0) < max_won:
                        logger.info(f"User {game['player_email']} lost skins game {game['id']}")
                        lost_games.append(game)
                except Exception as e:
                    logger.warning(f"Error parsing skins state_json for game {game['id']}: {e}", exc_info=True)
        return {"games": lost_games}
    except Exception as e:
        logger.error(f"Error fetching games lost: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="Failed to fetch games lost.")
    finally:
        cursor.close()
        db.close()

@app.patch("/games/{game_id}/complete")
def mark_game_complete(game_id: int):
    logger.info(f"[PATCH /games/{game_id}/complete] Marking game {game_id} as complete")
    db = get_db()
    cursor = db.cursor()
    try:
        cursor.execute(
            "UPDATE games SET is_complete = TRUE, completed_at = CURRENT_TIMESTAMP WHERE id = %s AND is_complete = FALSE",
            (game_id,)
        )
        db.commit()
        if cursor.rowcount == 0:
            logger.warning(f"Game {game_id} not found or already complete.")
            raise HTTPException(status_code=404, detail="Game not found or already complete.")
        logger.info(f"Game {game_id} marked as complete.")
        return {"message": f"Game {game_id} marked as complete."}
    except Exception as e:
        db.rollback()
        logger.error(f"Error marking game complete: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="Failed to mark game as complete.")
    finally:
        cursor.close()
        db.close()

@app.get("/games/{game_id}/players")
def get_game_players(game_id: int):
    logger.info(f"[GET /games/{game_id}/players] Fetching players for game_id={game_id}")
    db = get_db()
    cursor = db.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
    try:
        cursor.execute(
            "SELECT name, email, user_id FROM game_players WHERE game_id = %s",
            (game_id,)
        )
        players = cursor.fetchall()
        logger.info(f"Fetched {len(players)} players for game_id={game_id}")
        return players
    except Exception as e:
        logger.error(f"Error fetching players for game {game_id}: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="Failed to fetch players.")
    finally:
        cursor.close()
        db.close()

@app.get("/games/{game_id}/skins")
def get_skins_results(game_id: int):
    """
    Calculate and return Skins results for a given game.
    """
    db = get_db()
    cursor = db.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
    try:
        # Fetch game info
        cursor.execute("SELECT skin_value, state_json FROM games WHERE id = %s", (game_id,))
        game_row = cursor.fetchone()
        if not game_row:
            raise HTTPException(status_code=404, detail="Game not found.")
        skin_value = game_row['skin_value'] or 0
        state_json = game_row['state_json']
        if state_json and isinstance(state_json, str):
            state_json = json.loads(state_json)
        # Expecting state_json to have 'scores': {email: [hole1, hole2, ...]}
        scores = state_json.get('scores', {})
        if not scores:
            raise HTTPException(status_code=400, detail="No scores found for this game.")
        num_holes = len(next(iter(scores.values())))
        emails = list(scores.keys())
        skins = []
        carryover = 0
        for h in range(num_holes):
            hole_scores = {email: scores[email][h] for email in emails}
            min_score = min(hole_scores.values())
            winners = [email for email, score in hole_scores.items() if score == min_score]
            if len(winners) == 1:
                skins.append({
                    'hole': h+1,
                    'winner': winners[0],
                    'value': skin_value * (carryover + 1)
                })
                carryover = 0
            else:
                skins.append({
                    'hole': h+1,
                    'winner': None,
                    'value': 0
                })
                carryover += 1
        # Tally total skins and winnings per player
        player_totals = defaultdict(lambda: {'skins': 0, 'winnings': 0})
        for skin in skins:
            if skin['winner']:
                player_totals[skin['winner']]['skins'] += 1
                player_totals[skin['winner']]['winnings'] += skin['value']
        return {
            'skins': skins,
            'player_totals': player_totals
        }
    except Exception as e:
        logger.error(f"Error calculating skins: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="Failed to calculate skins.")
    finally:
        cursor.close()
        db.close()

@app.delete("/games/{game_id}")
def delete_game(game_id: int):
    db = get_db()
    cursor = db.cursor()
    try:
        cursor.execute("SELECT 1 FROM games WHERE id = %s", (game_id,))
        if cursor.fetchone() is None:
            logger.warning(f"Attempted to delete non-existent game {game_id}.")
            raise HTTPException(status_code=404, detail=f"Game {game_id} not found.")
        cursor.execute("DELETE FROM game_players WHERE game_id = %s", (game_id,))
        cursor.execute("DELETE FROM games WHERE id = %s", (game_id,))
        db.commit()
        logger.info(f"Deleted game {game_id} and its players.")
        return {"message": f"Game {game_id} deleted."}
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        logger.error(f"Error deleting game: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="Failed to delete game.")
    finally:
        cursor.close()
        db.close()

# Achievement and Leaderboard Endpoints

@app.get("/achievements")
def get_all_achievements():
    """
    Get all achievements. Secret achievements are included but marked as such.
    """
    db = get_db()
    cursor = db.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
    try:
        cursor.execute("""
            SELECT id, name, description, icon, category, points, is_secret
            FROM achievements 
            ORDER BY category, points DESC
        """)
        achievements = cursor.fetchall()
        return {"achievements": achievements}
    except Exception as e:
        logger.error(f"Error fetching achievements: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="Failed to fetch achievements.")
    finally:
        cursor.close()
        db.close()

@app.get("/users/{user_id}/achievements")
def get_user_achievements(user_id: int):
    """
    Get user's unlocked achievements with unlock dates.
    """
    db = get_db()
    cursor = db.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
    try:
        cursor.execute("""
            SELECT a.id, a.name, a.description, a.icon, a.category, a.points, 
                   a.is_secret, ua.unlocked_at, ua.progress_data
            FROM achievements a
            LEFT JOIN user_achievements ua ON a.id = ua.achievement_id AND ua.user_id = %s
            ORDER BY a.category, ua.unlocked_at DESC NULLS LAST, a.points DESC
        """, (user_id,))
        achievements = cursor.fetchall()
        
        # Process achievements to show unlock status
        processed_achievements = []
        for achievement in achievements:
            achievement_data = dict(achievement)
            achievement_data['unlocked'] = achievement['unlocked_at'] is not None
            if achievement_data['unlocked']:
                achievement_data['unlocked_at'] = achievement['unlocked_at'].isoformat() if achievement['unlocked_at'] else None
            processed_achievements.append(achievement_data)
            
        return {"achievements": processed_achievements}
    except Exception as e:
        logger.error(f"Error fetching user achievements: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="Failed to fetch user achievements.")
    finally:
        cursor.close()
        db.close()

@app.post("/users/{user_id}/achievements/{achievement_id}/unlock")
def unlock_achievement(user_id: int, achievement_id: int, game_id: Optional[int] = None):
    """
    Unlock an achievement for a user. Called internally when conditions are met.
    """
    db = get_db()
    cursor = db.cursor()
    try:
        # Check if already unlocked
        cursor.execute(
            "SELECT id FROM user_achievements WHERE user_id = %s AND achievement_id = %s",
            (user_id, achievement_id)
        )
        if cursor.fetchone():
            return {"message": "Achievement already unlocked"}
            
        # Unlock the achievement
        cursor.execute("""
            INSERT INTO user_achievements (user_id, achievement_id, game_id, unlocked_at)
            VALUES (%s, %s, %s, CURRENT_TIMESTAMP)
        """, (user_id, achievement_id, game_id))
        
        db.commit()
        logger.info(f"Unlocked achievement {achievement_id} for user {user_id}")
        return {"message": "Achievement unlocked!"}
    except Exception as e:
        db.rollback()
        logger.error(f"Error unlocking achievement: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="Failed to unlock achievement.")
    finally:
        cursor.close()
        db.close()

@app.get("/leaderboards/{leaderboard_type}")
def get_leaderboard(
    leaderboard_type: str, 
    game_type: Optional[str] = None,
    limit: int = 50
):
    """
    Get leaderboard data. Types: 'weekly', 'monthly', 'all_time'
    Optional game_type filter: 'wolf', 'skins', etc.
    """
    db = get_db()
    cursor = db.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
    try:
        # Calculate date ranges for weekly/monthly
        now = datetime.now()
        if leaderboard_type == 'weekly':
            start_date = now - timedelta(days=7)
        elif leaderboard_type == 'monthly':
            start_date = now - timedelta(days=30)
        elif leaderboard_type == 'all_time':
            start_date = None
        else:
            raise HTTPException(status_code=400, detail="Invalid leaderboard type")
        
        # Build query based on parameters
        base_query = """
            SELECT 
                u.id as user_id,
                u.name as user_name,
                COUNT(CASE WHEN winner.user_id IS NOT NULL THEN 1 END) as games_won,
                COUNT(g.id) as total_games,
                CASE 
                    WHEN COUNT(g.id) > 0 
                    THEN ROUND(COUNT(CASE WHEN winner.user_id IS NOT NULL THEN 1 END)::numeric / COUNT(g.id) * 100, 1)
                    ELSE 0 
                END as win_rate,
                COALESCE(SUM(ua_points.points), 0) as total_achievement_points
            FROM users u
            LEFT JOIN game_players gp ON u.id = gp.user_id
            LEFT JOIN games g ON gp.game_id = g.id AND g.is_complete = true
        """
        
        # Add date filter if needed
        if start_date:
            base_query += " AND g.completed_at >= %s"
        
        # Add game type filter if specified
        if game_type:
            base_query += " AND g.game_type = %s"
        
        # Add winner calculation (simplified - you may need to adjust based on your win logic)
        base_query += """
            LEFT JOIN (
                SELECT DISTINCT g.id as game_id, winner_gp.user_id
                FROM games g
                JOIN game_players winner_gp ON g.id = winner_gp.game_id
                WHERE g.is_complete = true
                -- Add your specific win condition logic here based on game type
            ) winner ON g.id = winner.game_id AND u.id = winner.user_id
            LEFT JOIN (
                SELECT ua.user_id, SUM(a.points) as points
                FROM user_achievements ua
                JOIN achievements a ON ua.achievement_id = a.id
                GROUP BY ua.user_id
            ) ua_points ON u.id = ua_points.user_id
            GROUP BY u.id, u.name, ua_points.points
            HAVING COUNT(g.id) > 0
            ORDER BY games_won DESC, win_rate DESC, total_achievement_points DESC
            LIMIT %s
        """
        
        # Prepare parameters
        params = []
        if start_date:
            params.append(start_date)
        if game_type:
            params.append(game_type)
        params.append(limit)
        
        cursor.execute(base_query, params)
        leaderboard_data = cursor.fetchall()
        
        # Add rankings
        for i, entry in enumerate(leaderboard_data):
            entry['rank'] = i + 1
        
        return {
            "leaderboard_type": leaderboard_type,
            "game_type": game_type,
            "entries": leaderboard_data,
            "last_updated": now.isoformat()
        }
    except Exception as e:
        logger.error(f"Error fetching leaderboard: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="Failed to fetch leaderboard.")
    finally:
        cursor.close()
        db.close()

def check_and_unlock_achievements(user_id: int, game_id: int):
    """
    Check if user qualifies for any achievements after completing a game.
    This should be called after every completed game.
    """
    db = get_db()
    cursor = db.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
    try:
        # Get user's game history and stats for achievement checking
        cursor.execute("""
            SELECT 
                COUNT(*) as total_games,
                COUNT(CASE WHEN g.is_complete THEN 1 END) as completed_games,
                COUNT(CASE WHEN winner.game_id IS NOT NULL THEN 1 END) as games_won
            FROM game_players gp
            JOIN games g ON gp.game_id = g.id
            LEFT JOIN (
                -- Simplified win detection - adjust based on your game logic
                SELECT game_id FROM games WHERE is_complete = true
            ) winner ON g.id = winner.game_id
            WHERE gp.user_id = %s
        """, (user_id,))
        stats = cursor.fetchone()
        
        achievements_to_unlock = []
        
        # Check various achievement conditions
        if stats['completed_games'] == 1:
            achievements_to_unlock.append(1)  # Getting Started
        if stats['games_won'] == 1:
            achievements_to_unlock.append(2)  # First Win
        if stats['completed_games'] == 100:
            achievements_to_unlock.append(11)  # Century Club
            
        # Unlock achievements
        for achievement_id in achievements_to_unlock:
            try:
                unlock_achievement(user_id, achievement_id, game_id)
            except:
                pass  # Achievement may already be unlocked
                
        return achievements_to_unlock
    except Exception as e:
        logger.error(f"Error checking achievements: {e}", exc_info=True)
        return []
    finally:
        cursor.close()
        db.close()

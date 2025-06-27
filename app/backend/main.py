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

app = FastAPI()

# Middleware for CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://golfleaguegames.netlify.app",  # Production Netlify site
        "http://localhost:5173"  # Local dev (optional)
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

class GameStateUpdate(BaseModel):
    current_hole: int
    state_json: dict

@app.post("/games/")
def create_game(game: GameCreate):
    logger.info(f"Received request to create game: {game}")
    db = get_db()
    cursor = db.cursor()
    try:
        # Insert game with default state_json as empty object
        cursor.execute(
            "INSERT INTO games (game_type, is_complete, state_json) VALUES (%s, %s, %s) RETURNING id",
            (game.game_type, False, json.dumps({}))
        )
        game_id = cursor.fetchone()[0]
        logger.info(f"Inserted game with ID: {game_id}")
        # Insert players
        for player in game.players:
            logger.info(f"Processing player: {player}")
            # Try to find a known user by email
            cursor.execute(
                "SELECT id FROM users WHERE email = %s",
                (player.email,)
            )
            user_row = cursor.fetchone()
            user_id = user_row[0] if user_row else None
            if user_id:
                logger.info(f"Found existing user with ID: {user_id} for email: {player.email}")
            else:
                logger.info(f"No user found for email: {player.email}, will create as guest")
            cursor.execute(
                "INSERT INTO game_players (game_id, user_id, name, email) VALUES (%s, %s, %s, %s)",
                (game_id, user_id, player.name, player.email)
            )
            logger.info(f"Inserted player {player.name} (email: {player.email}) into game_players")
        db.commit()
        logger.info(f"Committed all changes for game ID: {game_id}")
    except Exception as e:
        db.rollback()
        logger.error(f"Error creating game: {e}")
        raise HTTPException(status_code=500, detail="Failed to create game.")
    finally:
        cursor.close()
        db.close()
        logger.info(f"Closed DB connection for game ID: {game_id}")
    return {"game_id": game_id, "message": "Game created successfully"}

@app.patch("/games/{game_id}/state")
def update_game_state(game_id: int, state: GameStateUpdate):
    db = get_db()
    cursor = db.cursor()
    try:
        cursor.execute(
            "UPDATE games SET current_hole = %s, state_json = %s WHERE id = %s AND is_complete = FALSE",
            (state.current_hole, json.dumps(state.state_json), game_id)
        )
        db.commit()
        if cursor.rowcount == 0:
            raise HTTPException(status_code=400, detail="Cannot update a completed game.")
        logger.info(f"Updated state for game {game_id}")
        return {"message": "Game state updated"}
    except Exception as e:
        db.rollback()
        logger.error(f"Error updating game state: {e}")
        raise HTTPException(status_code=500, detail="Failed to update game state.")
    finally:
        cursor.close()
        db.close()

@app.get("/games/{game_id}/state")
def get_game_state(game_id: int):
    db = get_db()
    cursor = db.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
    try:
        cursor.execute("SELECT current_hole, state_json, game_type, is_complete FROM games WHERE id = %s", (game_id,))
        row = cursor.fetchone()
        if not row:
            raise HTTPException(status_code=404, detail="Game not found.")
        # Parse JSON if present
        state_json = row['state_json']
        if state_json and isinstance(state_json, str):
            state_json = json.loads(state_json)
        return {
            "current_hole": row['current_hole'],
            "state_json": state_json,
            "game_type": row['game_type'],
            "is_complete": row['is_complete']
        }
    finally:
        cursor.close()
        db.close()

@app.get("/")
def read_root():
    return {"message": "Hello from FastAPI backend!"}

@app.get("/users/{user_id}/games-won")
def get_games_won(user_id: str):
    db = get_db()
    cursor = db.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
    try:
        # Find all games the user participated in
        cursor.execute('''
            SELECT g.id, g.game_type, g.current_hole, g.is_complete, g.state_json, g.completed_at, g.created_at,
                   gp.name AS player_name, gp.email AS player_email
            FROM games g
            JOIN game_players gp ON g.id = gp.game_id
            WHERE gp.user_id = %s OR gp.email = %s
            ORDER BY g.completed_at DESC NULLS LAST, g.created_at DESC
        ''', (user_id, user_id))
        games = cursor.fetchall()
        won_games = []
        for game in games:
            # Only process wolf games with state_json containing points
            if game['game_type'] == 'wolf' and game['state_json']:
                try:
                    state = game['state_json'] if isinstance(game['state_json'], dict) else json.loads(game['state_json'])
                    points = state.get('points', {})
                    # points: {email: [int, int, ...]} or similar
                    user_points = sum(points.get(game['player_email'], []))
                    all_scores = [(email, sum(pts)) for email, pts in points.items()]
                    all_scores.sort(key=lambda x: x[1], reverse=True)
                    if all_scores and all_scores[0][0] == game['player_email']:
                        won_games.append(game)
                except Exception as e:
                    logger.warning(f"Error parsing state_json for game {game['id']}: {e}")
        return {"games": won_games}
    finally:
        cursor.close()
        db.close()

@app.get("/users/{user_id}/games-lost")
def get_games_lost(user_id: str):
    db = get_db()
    cursor = db.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
    try:
        cursor.execute('''
            SELECT g.id, g.game_type, g.current_hole, g.is_complete, g.state_json, g.completed_at, g.created_at,
                   gp.name AS player_name, gp.email AS player_email
            FROM games g
            JOIN game_players gp ON g.id = gp.game_id
            WHERE gp.user_id = %s OR gp.email = %s
            ORDER BY g.completed_at DESC NULLS LAST, g.created_at DESC
        ''', (user_id, user_id))
        games = cursor.fetchall()
        lost_games = []
        for game in games:
            if game['game_type'] == 'wolf' and game['state_json']:
                try:
                    state = game['state_json'] if isinstance(game['state_json'], dict) else json.loads(game['state_json'])
                    points = state.get('points', {})
                    user_points = sum(points.get(game['player_email'], []))
                    all_scores = [(email, sum(pts)) for email, pts in points.items()]
                    all_scores.sort(key=lambda x: x[1])  # Ascending
                    if all_scores and all_scores[0][0] == game['player_email']:
                        lost_games.append(game)
                except Exception as e:
                    logger.warning(f"Error parsing state_json for game {game['id']}: {e}")
        return {"games": lost_games}
    finally:
        cursor.close()
        db.close()

@app.patch("/games/{game_id}/complete")
def mark_game_complete(game_id: int):
    db = get_db()
    cursor = db.cursor()
    try:
        cursor.execute(
            "UPDATE games SET is_complete = TRUE, completed_at = CURRENT_TIMESTAMP WHERE id = %s AND is_complete = FALSE",
            (game_id,)
        )
        db.commit()
        if cursor.rowcount == 0:
            raise HTTPException(status_code=404, detail="Game not found or already complete.")
        return {"message": f"Game {game_id} marked as complete."}
    except Exception as e:
        db.rollback()
        logger.error(f"Error marking game complete: {e}")
        raise HTTPException(status_code=500, detail="Failed to mark game as complete.")
    finally:
        cursor.close()
        db.close()

@app.get("/games/{game_id}/players")
def get_game_players(game_id: int):
    """
    Get the list of players for a given game from the game_players table.
    Returns: List of dicts with name, email, and user_id (if available).
    """
    db = get_db()
    cursor = db.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
    try:
        cursor.execute(
            "SELECT name, email, user_id FROM game_players WHERE game_id = %s",
            (game_id,)
        )
        players = cursor.fetchall()
        return players
    finally:
        cursor.close()
        db.close()

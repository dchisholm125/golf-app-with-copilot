from fastapi import FastAPI, HTTPException, Body, Path
from pydantic import BaseModel, EmailStr
from typing import List, Optional
import mysql.connector
import os
import logging
from dotenv import load_dotenv
import json
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI()

# Middleware for CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["https://golfleaguegames.netlify.app"],  # Add your Netlify URL
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
DB_CONFIG = {
    'host': os.getenv('MYSQL_HOST'),
    'user': os.getenv('MYSQL_USER'),
    'password': os.getenv('MYSQL_PASSWORD'),
    'database': os.getenv('MYSQL_DATABASE'),
}

def get_db():
    return mysql.connector.connect(**DB_CONFIG)

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
            "INSERT INTO games (game_type, is_complete, state_json) VALUES (%s, %s, %s)",
            (game.game_type, False, json.dumps({}))
        )
        game_id = cursor.lastrowid
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
    cursor = db.cursor(dictionary=True)
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
    # Dummy data for UI testing
    return {
        "games": [
            {
                "id": 1,
                "date": "2025-06-01",
                "type": "wolf",
                "strokes": [4, 5, 3, 4, 5, 4, 4, 3, 5],
                "points": [1, 2, 0, 1, 2, 1, 1, 0, 2]
            },
            {
                "id": 2,
                "date": "2025-05-20",
                "type": "skins",
                "strokes": [5, 4, 4, 5, 3, 4, 5, 4, 4],
                "points": [2, 1, 1, 2, 0, 1, 2, 1, 1]
            },
            {
                "id": 3,
                "date": "2025-05-10",
                "type": "sixsixsix",
                "strokes": [],
                "points": []
            }
        ]
    }

@app.get("/users/{user_id}/games-lost")
def get_games_lost(user_id: str):
    # Dummy data for UI testing
    return {
        "games": [
            {
                "id": 4,
                "date": "2025-06-15",
                "type": "wolf",
                "strokes": [5, 6, 4, 5, 6, 5, 5, 4, 6],
                "points": [0, 1, 0, 0, 1, 0, 0, 1, 0]
            },
            {
                "id": 5,
                "date": "2025-05-25",
                "type": "skins",
                "strokes": [6, 5, 5, 6, 4, 5, 6, 5, 5],
                "points": [0, 0, 1, 0, 1, 0, 0, 1, 0]
            },
            {
                "id": 6,
                "date": "2025-05-12",
                "type": "sixsixsix",
                "strokes": [],
                "points": []
            }
        ]
    }

@app.patch("/games/{game_id}/complete")
def mark_game_complete(game_id: int):
    db = get_db()
    cursor = db.cursor()
    try:
        cursor.execute(
            "UPDATE games SET is_complete = TRUE, completed_at = NOW() WHERE id = %s AND is_complete = FALSE",
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
    cursor = db.cursor(dictionary=True)
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

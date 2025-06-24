from fastapi import FastAPI, HTTPException, Body
from pydantic import BaseModel, EmailStr
from typing import List, Optional
import mysql.connector
import os
import logging
from dotenv import load_dotenv
import json

app = FastAPI()

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
        # Insert game
        cursor.execute(
            "INSERT INTO games (game_type) VALUES (%s)",
            (game.game_type,)
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
            "UPDATE games SET current_hole = %s, state_json = %s WHERE id = %s",
            (state.current_hole, json.dumps(state.state_json), game_id)
        )
        db.commit()
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
        cursor.execute("SELECT current_hole, state_json FROM games WHERE id = %s", (game_id,))
        row = cursor.fetchone()
        if not row:
            raise HTTPException(status_code=404, detail="Game not found.")
        # Parse JSON if present
        state_json = row['state_json']
        if state_json and isinstance(state_json, str):
            state_json = json.loads(state_json)
        return {"current_hole": row['current_hole'], "state_json": state_json}
    finally:
        cursor.close()
        db.close()

@app.get("/")
def read_root():
    return {"message": "Hello from FastAPI backend!"}

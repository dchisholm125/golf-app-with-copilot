from typing import Dict, List
from fastapi import WebSocket


class ConnectionManager:
    """Manages WebSocket connections per game."""

    def __init__(self) -> None:
        self.active_connections: Dict[int, List[WebSocket]] = {}

    async def connect(self, game_id: int, websocket: WebSocket) -> None:
        await websocket.accept()
        self.active_connections.setdefault(game_id, []).append(websocket)

    def disconnect(self, game_id: int, websocket: WebSocket) -> None:
        if game_id in self.active_connections:
            if websocket in self.active_connections[game_id]:
                self.active_connections[game_id].remove(websocket)
            if not self.active_connections[game_id]:
                del self.active_connections[game_id]

    async def broadcast(self, game_id: int, message: dict) -> None:
        for connection in self.active_connections.get(game_id, []):
            await connection.send_json(message)

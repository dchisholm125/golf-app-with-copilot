# FastAPI backend for Golf App

This is the backend service for the Golf App, built with FastAPI.

## Philosophy
- **Documentation:** All backend code and APIs are thoroughly documented and kept up to date. Documentation is clear, complete, and beginner-friendly.
- **User Experience:** API design and error messages are user-first, clear, and actionable.
- **Separation of Concerns:** Business logic is kept out of API route handlers and placed in dedicated modules/services for maintainability and testability.

## Setup

1. Create a virtual environment:
   ```bash
   python3 -m venv venv
   source venv/bin/activate
   ```
2. Install dependencies:
   ```bash
   pip install fastapi uvicorn[standard] mysql-connector-python
   ```
3. Run the server:
   ```bash
   uvicorn main:app --reload
   ```

## Auth0 Integration
- Auth0 authentication will be added to secure API endpoints.

## Stripe Integration (Planned)
- Stripe will be used for secure payment processing.
- Payment logic will be modular and PCI-compliant, with no raw card data handled by the backend.

## Real-time WebSocket Updates
FastAPI now exposes a `/ws/games/{game_id}` endpoint that allows clients to
subscribe to live game changes. The `ConnectionManager` class manages
connections per game and broadcasts JSON messages to all players.

## Database (MySQL)
- MySQL will be used to persist user, game, and statistics data.
- FastAPI will serve as the backend API between the UI and the database.
- Database connection and models will be documented here as they are added.

---

## Project Structure
- `main.py`: FastAPI entrypoint
- `websocket_manager.py`: In-memory connection manager for WebSocket clients
- More modules to be added as the project grows

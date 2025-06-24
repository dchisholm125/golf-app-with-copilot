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
   pip install fastapi uvicorn[standard]
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

---

## Project Structure
- `main.py`: FastAPI entrypoint
- More modules to be added as the project grows

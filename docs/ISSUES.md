# Planned Enhancements

This document tracks proposed GitHub issues to expand the project.

## 1. Real-time Collaboration
- Implement WebSocket support in FastAPI for live score updates.
- Create a simple in-memory broadcaster to distribute messages to all connected clients of a game.
- Update frontend to connect via WebSocket and reflect live changes.

## 2. AI-driven Insights and Personalization
- Analyze player scores to generate strategy tips.
- Add backend endpoint that produces summary stats and recommendations.
- Integrate with the newsletter script for personalized weekly updates.

## 3. Expand Game Types and Leaderboards
- Add modules for stroke play, match play, Stableford and Ryder Cup.
- Extend leaderboard logic to handle multiple game types and new stats (birdies, pars, handicap improvement).

## 4. Backend Architecture Improvements
- Migrate from raw SQL to SQLAlchemy ORM for safer queries and relationships.
- Evaluate async database drivers for scalability.

## 5. Enhanced Testing and CI/CD
- Add unit tests for API routes and Vue components.
- Integrate GitHub Actions to run tests and linting on every push.

## 6. Security and Compliance
- Implement rate limiting and CSRF protection.
- Plan modular payment processing for future side bets with PCI compliance in mind.

## 7. Polished User Experience
- Improve dark-mode styles and responsive layouts.
- Add offline-first capabilities with service workers.
- Perform accessibility audits and address issues.


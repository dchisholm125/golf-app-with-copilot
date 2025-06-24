# Golf App Monorepo

This project contains:
- Frontend: Vue 3 + TypeScript (Vite)
- Backend: FastAPI (Python)
- Auth0 authentication (to be integrated)
- Stripe payment processing (planned)

## Philosophy
- **Documentation:** All code, APIs, and features are thoroughly documented and kept up to date. Documentation is clear, complete, and beginner-friendly.
- **User Experience:** UX is a top priority. All features and interfaces are designed with a user-first mindset for clarity, accessibility, and ease of use.
- **Separation of Concerns:** UI logic is kept separate from business logic. Business logic should not reside in Vue components or other UI layers, but in dedicated modules/services for maintainability and testability.

## Getting Started

### Frontend
```bash
cd app
npm install
npm run dev
```

### Backend
```bash
cd app/backend
python3 -m venv venv
source venv/bin/activate
pip install fastapi uvicorn[standard]
uvicorn main:app --reload
```

## Auth0
- Auth0 authentication will be integrated in both frontend and backend.

## Payments (Stripe)
- Stripe will be used for secure payment processing. All payment logic will be modular and PCI-compliant, with no raw card data handled by the app.
- Integration will be planned for future releases.

---

For more details, see the README in each subdirectory.

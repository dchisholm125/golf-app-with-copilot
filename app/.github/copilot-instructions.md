<!-- Use this file to provide workspace-specific custom instructions to Copilot. For more details, visit https://code.visualstudio.com/docs/copilot/copilot-customization#_use-a-githubcopilotinstructionsmd-file -->

This workspace is a monorepo for a golf app with:
- Frontend: Vue 3 + TypeScript (Vite)
- Backend: FastAPI (Python)
- Auth0 for authentication
- Stripe for payment processing (planned)

**Documentation and UX Philosophy:**
- All code and APIs must be thoroughly documented, clear, and beginner-friendly.
- User Experience (UX) is a top priority; make decisions with a user-first mindset.
- Keep all documentation up to date and accessible.
- Keep business logic out of Vue components and UI layers; use dedicated modules/services for business logic.

When generating code, prefer modular, clean, and secure patterns. Integrate Auth0 for authentication in both frontend and backend. Use RESTful API design for backend endpoints. Plan for Stripe integration by keeping payment logic modular and secure, and never handle raw card data directly in the app.

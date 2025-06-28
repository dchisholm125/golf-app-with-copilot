# Copilot Custom Instructions for Golf App Monorepo

## Vue File Structure
- Always place the `<script>` tag before the `<template>` tag in all `.vue` files for consistency and readability.

## General Guidelines
- All code and APIs must be thoroughly documented, clear, and beginner-friendly.
- User Experience (UX) is a top priority; make decisions with a user-first mindset.
- Keep all documentation up to date and accessible.
- Keep business logic out of Vue components and UI layers; use dedicated modules/services for business logic.
- Prefer modular, clean, and secure patterns.
- Integrate Auth0 for authentication in both frontend and backend.
- Use RESTful API design for backend endpoints.
- Plan for Stripe integration by keeping payment logic modular and secure, and never handle raw card data directly in the app.

## Playwright E2E Testing Requirements

### Authentication
- **MANDATORY**: All new Playwright tests MUST use the `TestHelpers` class for authentication and navigation.
- Always start tests with: 
  ```typescript
  test.beforeEach(async ({ page }) => {
    helpers = new TestHelpers(page)
    await helpers.navigateToApp() // This handles Auth0 authentication automatically
  })
  ```
- Never implement manual Auth0 login logic in individual tests.
- Use `helpers.navigateToLeaderboards()` and `helpers.navigateToAchievements()` for navigation instead of `page.goto()`.

### Test Structure
- All E2E tests should be resilient to Auth0 redirects and authentication states.
- Use proper wait strategies: `page.waitForSelector()`, `page.waitForLoadState()`, etc.
- Handle both success and error states gracefully in tests.
- Use test data that works with the development database (dev@dev.dev user).

### Error Handling
- Always check for both success states and error states in tests.
- Use conditional logic to handle cases where data might not be available.
- Include proper timeout handling for async operations.

## Dark Mode Implementation
- All new Vue components must support dark mode using the `useDarkMode` composable.
- Use CSS classes `dark-mode` on the body element for styling.
- Ensure proper lifecycle management to avoid Vue warnings.
- Test dark mode toggle functionality in Playwright tests.

## Database and Backend
- Use SQLite for development with proper schema migrations.
- Always provide dummy data scripts for testing (dev_data.sql).
- Include proper foreign key constraints and relationships.
- Implement caching strategies for performance-critical endpoints (like leaderboards).

## Frontend Architecture
- Use composables for shared logic (e.g., `useCurrentUser`, `useWolfGameState`, `useDarkMode`).
- Keep components focused and single-purpose.
- Implement proper error boundaries and loading states.
- Use TypeScript interfaces for all data models.

## API Design
- Follow RESTful conventions for all endpoints.
- Implement proper authentication middleware for protected routes.
- Return consistent error response formats.
- Include proper CORS configuration for development.

## Project File Organization
```
app/
├── src/
│   ├── components/     # Reusable Vue components
│   ├── views/         # Page components
│   ├── composables/   # Vue composables for shared logic
│   ├── services/      # API service layers
│   ├── auth/          # Auth0 configuration
│   └── router/        # Vue Router configuration
├── backend/
│   ├── main.py        # FastAPI application
│   ├── schema.sql     # Database schema
│   ├── *_data.sql     # Data migration scripts
│   └── requirements.txt
├── tests/
│   ├── e2e/           # Playwright E2E tests
│   ├── utils/         # Test utilities (TestHelpers)
│   └── README.md      # Testing documentation
└── util/              # Miscellaneous utilities
```

## Development Workflow
- Always run tests after implementing new features.
- Commit frequently with descriptive messages.
- Update documentation when adding new features.
- Use proper TypeScript types throughout the codebase.
- Handle loading states and error states in all UI components.

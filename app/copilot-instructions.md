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

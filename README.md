# golf-app-with-copilot

A modern, full-stack golf scoring app for the Wolf game and more, built with Vue 3 + TypeScript (Vite), FastAPI, PostgreSQL, and Auth0. Features robust state management, mobile-optimized UI, cloud deployment, and a styled HTML newsletter script.

---

## Features
- **Wolf Game**: Play, score, and track the Wolf golf game with correct rules, rotation, and scoring.
- **Modular UI**: Clean, beginner-friendly Vue 3 components and composables.
- **Mobile-First Design**: Responsive layouts and controls for all devices.
- **Authentication**: Auth0 integration for secure login.
- **Cloud-Ready**: Deploy frontend to Netlify, backend to Render, and use managed PostgreSQL.
- **Newsletter Script**: Send beautiful HTML golf newsletters via Gmail.
- **Thorough Documentation**: All code and APIs are documented for clarity and learning.

---

## Project Structure

```
├── app/
│   ├── src/                # Frontend (Vue 3 + Vite + TypeScript)
│   │   ├── components/     # Modular UI components
│   │   ├── composables/    # State and logic composables
│   │   ├── services/       # API and business logic
│   │   ├── views/          # Page views
│   │   ├── config.ts       # Centralized config
│   ├── backend/            # FastAPI backend
│   │   ├── main.py         # FastAPI app
│   │   ├── schema.sql      # PostgreSQL schema
│   │   ├── requirements.txt# Backend dependencies
│   │   └── .env            # Backend environment variables
│   ├── util/
│   │   ├── send_newsletter.py # HTML newsletter script
│   │   └── golf_logo.png      # Logo for newsletter
│   └── .env                # Frontend environment variables
├── README.md
```

---

## Environment Variables

### Frontend (`app/.env`)
```
VITE_AUTH0_DOMAIN=your-auth0-domain
VITE_AUTH0_CLIENT_ID=your-auth0-client-id
VITE_AUTH0_AUDIENCE=your-auth0-audience
VITE_API_BASE_URL=https://your-backend.onrender.com
```

### Backend (`app/backend/.env`)
```
DATABASE_URL=postgresql://user:password@host:port/dbname
GMAIL_USER=your_gmail_address@gmail.com
GMAIL_PASSWORD=your_gmail_app_password
RECIPIENT=recipient@example.com
```

---

## Local Development

### Frontend
```bash
cd app
npm install
npm run dev
```

### Backend
```bash
cd app/backend
pip install -r requirements.txt
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

### Newsletter Script
```bash
cd app/util
python send_newsletter.py
```

---

## Deployment

### Frontend (Netlify)
- Connect your repo to Netlify.
- Set frontend environment variables in the Netlify dashboard.
- Deploy!

### Backend (Render)
- Create a new Web Service from your repo.
- Set backend environment variables in the Render dashboard.
- Use the free managed PostgreSQL database.
- Deploy!

---

## Documentation & Philosophy
- All code is modular, documented, and beginner-friendly.
- Business logic is kept out of UI components.
- UX and accessibility are top priorities.
- Environment variables and deployment are cloud-ready.
- Contributions and questions are welcome!

---

## License
MIT

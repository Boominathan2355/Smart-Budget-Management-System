# Smart Budget Management System

A full‑stack application for managing budget requests, approvals, notifications, and reporting. Frontend is built with React + Vite + Tailwind CSS. Backend is an Express API with MongoDB and JWT authentication.

## Features
- Requests lifecycle: create, view, approve/reject, and track
- Proof uploads for approved requests
- Role-based access (admin, HOD, coordinator, approvers)
- Real-time-ish notifications (server-sent events) and email notifications
- Reports and analytics dashboard

## Tech Stack
- Frontend: React 18, Vite, Tailwind CSS, React Router, Recharts
- Backend: Node.js, Express, Mongoose (MongoDB)
- Auth: JWT (HTTP-only on client, token-based API)
- Email: Nodemailer (JSON transport in dev, SMTP in prod)

## Monorepo Structure
- `/src` – React app (Vite)
- `/server` – Express API server

## Prerequisites
- Node.js 18+
- npm 9+
- MongoDB 6+ running locally or a MongoDB Atlas connection string

## Environment Variables
Create a `.env` file in `/server` (same folder as `server.js`).

Required (with sensible defaults for local dev):
```
# Server
PORT=5000
MONGODB_URI=mongodb://localhost:27017/budget_management
JWT_SECRET=dev_secret

# Frontend
# Used in password reset links sent by the server
APP_URL=http://localhost:5173

# Email (optional in dev; enable to send real emails)
EMAIL_HOST=
EMAIL_PORT=587
EMAIL_USER=
EMAIL_PASS=
```
- When `EMAIL_*` variables are not set, emails are logged via Nodemailer `jsonTransport` and reset URLs are returned in the response for convenience.

## Install & Run
From the repository root:

### 1) Install dependencies
```bash
npm install
(cd server && npm install)
```

### 2) Start the backend (server)
```bash
cd server
npm run dev
# or: npm start
```
The API will run on `http://localhost:5000` by default.

### 3) Start the frontend (client)
In a new terminal from the repo root:
```bash
npm run dev
```
The app will be available at `http://localhost:5173`.

## API Base URL
- Local development: `http://localhost:5000/api`

## Scripts
Root `package.json`:
- `npm run dev` – start Vite dev server
- `npm run build` – build frontend
- `npm run preview` – preview built frontend
- `npm run lint` – run ESLint

Server `package.json`:
- `npm run dev` – run Express with Node watch
- `npm start` – run Express server

## Design System
See `DESIGN.md` for typography, colors, components, layout utilities, and accessibility guidelines used throughout the UI.

## File Uploads
- Uploaded proofs are stored under `server/uploads/proofs` and served at `/uploads/*`.

## License
MIT © 2025 Boominathan Alagirisamy

## Repository
- GitHub: https://github.com/Boominathan2355/Smart-Budget-Management-System

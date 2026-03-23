# Live Documentation (`livedoc.md`)

## Project Overview
This project is a full-stack app with:
- `client/`: React + Vite frontend
- `server/`: Express + MongoDB backend

Main implemented modules:
- Auth: Register, Login, Protected User endpoint
- Contact: Contact form save endpoint
- Validation and centralized error handling on backend

---

## Tech Stack

### Frontend
- React (`react`, `react-dom`)
- React Router (`react-router-dom`)
- Vite (build/dev server)

### Backend
- Node.js + Express
- MongoDB with Mongoose
- JWT authentication (`jsonwebtoken`)
- Password hashing (`bcrypt`)
- Request validation (`zod`)
- CORS (`cors`)
- Environment variables (`dotenv`)

---

## Backend Architecture

### Entry Point
- File: `server/server.js`
- Responsibilities:
  - Load env vars
  - Enable CORS and JSON parsing
  - Mount routes:
    - `/api/auth` -> auth routes
    - `/api/form` -> contact routes
  - Register global `errorMiddleware`
  - Connect DB and start server

### Route Layer
- Files:
  - `server/router/auth-router.js`
  - `server/router/contact-router.js`
- Responsibilities:
  - Define URL + HTTP method mapping
  - Attach request validation middleware
  - Forward requests to controllers

### Controller Layer
- Files:
  - `server/controllers/auth-controller.js`
  - `server/controllers/contact-controller.js`
- Responsibilities:
  - Business logic
  - DB reads/writes via models
  - Build API responses
  - Forward errors to error middleware via `next(error)`

### Middleware Layer
- Files:
  - `server/middlewares/validate-middleware.js`
  - `server/middlewares/error-middleware.js`
  - `server/middlewares/auth-middleware.js`
- Responsibilities:
  - Input schema validation (`zod`)
  - Centralized error response formatting
  - JWT verification for protected routes

### Model Layer
- Files:
  - `server/models/user-models.js`
  - `server/models/contact-model.js`
- Responsibilities:
  - Schema definitions
  - Data constraints
  - Model-level methods/hooks (token generation, password compare/hash)

### Utility Layer
- File: `server/utils/db.js`
- Responsibilities:
  - Resolve DB URI from env (`DB_TARGET`, `LOCAL_DB_URI`, `MONGO_URI`)
  - Connect Mongoose and log active DB source

---

## Environment and DB Targeting

Configured in `server/.env`:
- `DB_TARGET=local|cloud`
- `LOCAL_DB_URI=...`
- `MONGO_URI=...`
- `JWT_SECRET=...`

How it works:
- `db.js` chooses URI based on `DB_TARGET`
- `local` -> uses local MongoDB
- `cloud` -> uses Atlas

Important:
- If data "does not appear", usually wrong DB target is being checked.

---

## API Endpoints

### Auth
Base: `/api/auth`

1. `GET /`
- Purpose: health/welcome route

2. `POST /register`
- Validation: `signupSchema`
- Body:
  - `username`, `email`, `phone`, `password`
- Flow:
  1. Normalize email
  2. Check existing user
  3. Create user (password hash via model pre-save hook)
  4. Return JWT token + userId

3. `POST /login`
- Validation: `loginSchema`
- Body:
  - `email`, `password`
- Flow:
  1. Normalize email
  2. Find user with password selected
  3. Compare password with `comparePassword`
  4. Return JWT token + userId

4. `GET /user` (protected)
- Middleware: `authMiddleware`
- Requires `Authorization: Bearer <token>`

### Contact
Base: `/api/form`

1. `POST /contact`
- Validation: `contactSchema`
- Body:
  - `username`, `email`, `message`
- Saves to `contacts` collection

---

## Core Functions and Methods

### User Model (`user-models.js`)
- `pre("save")`: hashes password using bcrypt
- `generateToken()`: creates JWT token
- `generateAuthToken()`: alias to `generateToken()`
- `comparePassword(password)`: compares plain text and hashed password

### Auth Controller (`auth-controller.js`)
- `home(req,res,next)`
- `register(req,res,next)`
- `login(req,res,next)`
- `user(req,res,...)`

### Validation Middleware
- `validate(schema)`
  - Parses body with zod schema
  - On fail attaches status/message and forwards error

### Error Middleware
- Handles malformed JSON (`entity.parse.failed`)
- Handles application errors (`status`, `message`, `details`)
- Returns unified JSON error format

### Auth Middleware
- Reads JWT from `Authorization` header
- Verifies token using `JWT_SECRET`
- Fetches user and attaches request data (`req.user`, etc.)

---

## Frontend Auth Flow

### Context API
- File: `client/src/store/auth.jsx`
- Provides:
  - `token`
  - `isLoggedIn`
  - `storeTokenInLS(serverToken)`
  - `logoutUser()`

### Pages
- `Register.jsx`
  - Calls `POST /api/auth/register`
  - Stores token through context
  - Redirects to login

- `Login.jsx`
  - Calls `POST /api/auth/login`
  - Stores token through context
  - Redirects home

- `Logout.jsx`
  - Calls `logoutUser()` via context
  - Redirects `/login`

### Navbar
- Shows `Logout` when logged in
- Shows `Register/Login` when logged out

---

## Meaning of Key Backend Terms

### Model
A model is the data blueprint + DB interface.
- Example: `User` model defines fields, validation, hooks, methods.

### Controller
A controller contains request business logic.
- Example: register/login behavior in `auth-controller.js`.

### Middleware
Middleware runs between request and controller/response.
- Validation middleware: checks request payload
- Auth middleware: checks JWT
- Error middleware: formats all errors in one place

### Router
Router maps URL + HTTP method to middleware/controllers.

---

## Current Notes / Improvements Recommended

1. In `auth-middleware.js`, avoid logging raw token and full user object in production.
2. In `auth-controller.js`, `user` handler currently references `next` in catch without receiving `next` arg; add `next` param for consistency.
3. Use a stronger `JWT_SECRET` value in `.env` (not placeholder).
4. Add protected-route frontend guard for authenticated pages.

---

## Quick Test Guide (Postman)

1. Register
- `POST http://localhost:5000/api/auth/register`
- JSON: `{ "username": "u", "email": "u@example.com", "phone": "1234567890", "password": "pass1234" }`

2. Login
- `POST http://localhost:5000/api/auth/login`
- JSON: `{ "email": "u@example.com", "password": "pass1234" }`

3. User (protected)
- `GET http://localhost:5000/api/auth/user`
- Header: `Authorization: Bearer <token>`

4. Contact
- `POST http://localhost:5000/api/form/contact`
- JSON: `{ "username": "u", "email": "u@example.com", "message": "Hello" }`

---

## Summary
The app follows standard layered backend architecture (router -> middleware -> controller -> model) and React Context-based auth state handling on frontend. Core auth/contact features are implemented and testable with Postman.
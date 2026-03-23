# PG & Hostel Finder System Setup (Reuse Current Auth + Navbar + Routes + Backend Pattern)

This guide helps you build a **PG & Hostel Finder System** using the **same authentication flow, navbar logic, route style, and backend structure** as your current project.

## 1) Prerequisites

- Node.js `22.17.0`
- MongoDB local or cloud
- PowerShell terminal (commands below are PowerShell)

## 2) Create Project (Monorepo style: `client` + `server`)

```powershell
cd C:\React
mkdir PG-Hostel-Finder
cd PG-Hostel-Finder
mkdir client, server
```

## 3) Frontend Setup (Vite + React)

```powershell
cd client
npm create vite@latest . -- --template react
npm install
npm install react-router-dom axios
```

## 4) Backend Setup (Express + Mongo + Auth)

```powershell
cd ..\server
npm init -y
npm install express cors dotenv mongoose bcrypt jsonwebtoken zod
npm install -D nodemon
```

Update `server/package.json` scripts:

```json
"scripts": {
  "start": "node server.js",
  "dev": "nodemon server.js"
}
```

## 5) Create Same Backend Folder Structure

Run from `PG-Hostel-Finder\server`:

```powershell
mkdir controllers, middlewares, models, router, utils, validators
ni server.js
ni .env
ni .env.example
ni controllers\auth-controller.js
ni controllers\listing-controller.js
ni controllers\contact-controller.js
ni middlewares\auth-middleware.js
ni middlewares\validate-middleware.js
ni middlewares\error-middleware.js
ni models\user-models.js
ni models\listing-model.js
ni models\contact-model.js
ni router\auth-router.js
ni router\listing-router.js
ni router\contact-router.js
ni utils\db.js
ni validators\auth-validator.js
ni validators\listing-validator.js
ni validators\contact-validator.js
```

## 6) Create Same Frontend Folder Structure

Run from `PG-Hostel-Finder\client\src`:

```powershell
mkdir components, pages, store
ni App.jsx
ni index.css
ni components\Navbar.jsx
ni components\Navbar.css
ni components\Footer.jsx
ni pages\Home.jsx
ni pages\Listings.jsx
ni pages\ListingDetails.jsx
ni pages\AddListing.jsx
ni pages\Contact.jsx
ni pages\About.jsx
ni pages\Login.jsx
ni pages\Register.jsx
ni pages\Logout.jsx
ni pages\Error.jsx
ni store\auth.jsx
```

## 7) Environment Variables

`server/.env`

```env
PORT=5000
JWT_SECRET=replace_with_strong_secret
DB_TARGET=local
LOCAL_DB_URI=mongodb://127.0.0.1:27017/pg_hostel_finder
MONGO_URI=
DB_URI=
```

## 8) Backend Route Plan (Same style as current project)

- `GET /api/auth/`
- `POST /api/auth/register`
- `POST /api/auth/login`
- `GET /api/auth/user` (protected)
- `GET /api/listings`
- `GET /api/listings/:id`
- `POST /api/listings` (protected)
- `PUT /api/listings/:id` (protected)
- `DELETE /api/listings/:id` (protected)
- `POST /api/form/contact`

## 9) Frontend Route Plan (Same style as your `App.jsx`)

- `/` -> Home
- `/listings` -> PG/Hostel cards with filters
- `/listings/:id` -> Listing details
- `/add-listing` -> Add new listing (logged-in users)
- `/about`
- `/contact`
- `/register`
- `/login`
- `/logout`
- `*` -> Error page

## 10) Navbar Logic (Same as your auth navbar)

- Always show: Home, Listings, About, Contact
- If logged in: Add Listing, Logout
- If not logged in: Register, Login
- Keep token in `localStorage` via `store/auth.jsx`

## 11) Run Project

Open 2 terminals:

Terminal 1 (backend):

```powershell
cd C:\React\PG-Hostel-Finder\server
npm run dev
```

Terminal 2 (frontend):

```powershell
cd C:\React\PG-Hostel-Finder\client
npm run dev
```

## 12) Copy-Paste Prompt (for Codex/ChatGPT)

Use this prompt to generate the full app with your same architecture:

```text
Create a full-stack PG & Hostel Finder System using React (Vite) for frontend and Node.js + Express + MongoDB for backend.

Important constraints:
1. Keep same architecture and file structure style as my existing project:
   - backend folders: controllers, middlewares, models, router, validators, utils
   - frontend folders: components, pages, store
2. Reuse same authentication pattern:
   - register/login with bcrypt + JWT
   - auth middleware for protected routes
   - token in localStorage
   - AuthContext with useAuth hook
3. Reuse same navbar behavior:
   - show Register/Login when logged out
   - show Logout and Add Listing when logged in
4. Use React Router routes:
   /, /listings, /listings/:id, /add-listing, /about, /contact, /register, /login, /logout, *
5. Build CRUD APIs for listings:
   - title, type (PG/Hostel), gender, price, city, area, amenities[], description, images[], owner
6. Add search/filter support:
   - city, max price, gender, type
7. Add contact form endpoint.
8. Use zod validation on backend request bodies.
9. Include complete code for all files, production-safe error handling, and clear comments only where needed.
10. Keep code simple and consistent with my current coding style.

Return output in this order:
A) Final folder tree
B) Backend code file-by-file
C) Frontend code file-by-file
D) .env.example
E) Run commands
```

## 13) Optional Next Upgrades

```powershell
cd C:\React\PG-Hostel-Finder\client
npm install react-hot-toast

cd ..\server
npm install multer cloudinary
```

- Add image upload for hostels/PGs
- Add favorites + shortlist
- Add owner dashboard + admin moderation

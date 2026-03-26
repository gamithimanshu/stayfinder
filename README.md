# StayFinder

StayFinder is a MERN stack PG and hostel management platform for residents, property owners, and admins. It includes listing discovery, bookings, payment tracking, wishlists, reviews, moderation workflows, and analytics dashboards for both admin and owner roles.

## Highlights

- Resident flow for browsing PGs, viewing details, booking rooms, and tracking payments
- Owner workspace for creating listings, managing inventory, and monitoring revenue and bookings
- Admin workspace for PG approvals, user management, support visibility, and platform analytics
- MongoDB-backed booking and payment relations across `User -> Booking -> PG -> Payment`
- Recharts-powered dashboards with monthly revenue, booking trends, top listings, and recent transactions
- Defensive frontend loading, empty, and error states for production use

## Tech Stack

- Frontend: React, Vite, Tailwind CSS, Recharts, Axios
- Backend: Node.js, Express
- Database: MongoDB with Mongoose
- Auth: JWT

## Project Structure

```text
StayFinder/
|-- client/
|   |-- public/
|   |-- src/
|   |   |-- components/
|   |   |-- hooks/
|   |   |-- pages/
|   |   |-- store/
|   |   `-- utils/
|   |-- package.json
|   `-- vite.config.js
|-- server/
|   |-- controllers/
|   |-- middlewares/
|   |-- models/
|   |-- router/
|   |-- scripts/
|   |-- utils/
|   `-- validators/
`-- README.md
```

## Core Modules

- `server/models/user-models.js`: users, roles, and auth helpers
- `server/models/pg-model.js`: PG/hostel listings and inventory
- `server/models/booking-model.js`: booking lifecycle and totals
- `server/models/payment-model.js`: payment status, amount, method, and transaction id
- `server/utils/dashboard-analytics.js`: shared analytics layer for admin and owner dashboards
- `client/src/pages/AdminDashboard.jsx`: platform analytics UI
- `client/src/pages/OwnerDashboard.jsx`: owner analytics UI

## Main Features

- Authentication and role-based access
- Public PG listing discovery
- PG detail pages with reviews and wishlists
- Booking creation and payment simulation flow
- Owner listing creation, editing, and deletion
- Admin PG approval and user management
- Responsive analytics dashboards with revenue and booking charts
- Auto-refreshing dashboard data after bookings and payment updates

## API Summary

### Auth

- `POST /api/auth/register`
- `POST /api/auth/login`
- `GET /api/auth/user`

### PG / Listing

- `GET /api/pg`
- `GET /api/pg/:id`
- `POST /api/owner/pgs`
- `PUT /api/owner/pgs/:id`
- `DELETE /api/owner/pgs/:id`

### Booking / Payment

- `POST /api/booking`
- `GET /api/booking/:bookingId/payment`
- `POST /api/booking/:bookingId/payment/process`

### Owner

- `GET /api/owner/dashboard`
- `GET /api/owner/pgs`
- `GET /api/owner/bookings`

### Admin

- `GET /api/admin/dashboard`
- `GET /api/admin/pgs/pending`
- `PUT /api/admin/approve/:id`
- `GET /api/admin/users`
- `DELETE /api/admin/users/:id`

### Other

- `POST /api/contact`
- `GET /api/wishlist`
- `POST /api/wishlist/:pgId`
- `GET /api/review/:pgId`
- `POST /api/review/:pgId`

## Local Setup

1. Clone the repository.
2. Install backend dependencies with `cd server && npm install`
3. Install frontend dependencies with `cd ../client && npm install`
4. Copy `server/.env.example` to `server/.env`
5. Configure MongoDB connection values in `server/.env`
6. Start the backend with `cd server && npm run dev`
7. Start the frontend with `cd client && npm run dev`
8. Open `http://localhost:5173`

## Sample Accounts

- Admin: `admin@stayfinder.com` / `Admin@123`
- Owner: `owner@stayfinder.com` / `Owner@123`
- User: `user@stayfinder.com` / `User@123`

## Recent Dashboard Work

- Fixed inconsistent earnings and booking totals by centralizing MongoDB aggregations
- Added monthly revenue and booking trend datasets in frontend-ready chart format
- Added top hostels and recent transactions sections for admin and owner dashboards
- Added safer loading, empty, and error handling around dashboard API requests
- Improved dashboard auto-refresh behavior for fresher analytics after payment and booking events

## Verification

- Frontend production build passes with `npm run build` inside `client`
- Server analytics modules pass syntax checks with `node --check`
- Current live-update behavior uses polling and focus refresh, and can be extended later with Socket.io if needed

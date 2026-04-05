# StayFinder

StayFinder is a full-stack MERN project for discovering, managing, approving, and booking PGs and hostels. It supports three roles:

- `User`: browse listings, add wishlist items, book rooms, make simulated payments, and leave reviews
- `Owner`: create and manage PG listings, track bookings, and view dashboard insights
- `Admin`: approve listings, manage users, monitor bookings, and review platform analytics

This project is suitable for a BCA major project because it demonstrates full-stack development, role-based access control, CRUD operations, database relationships, dashboards, validation, and responsive UI design.

## Key Features

- JWT-based authentication and role-based authorization
- PG listing discovery with filters for city, price, and gender
- Detailed PG pages with gallery, amenities, reviews, and wishlist support
- Booking flow with payment simulation
- Contact form with backend storage and email delivery support
- Owner dashboard for property management
- Admin dashboard for approvals, bookings, users, and messages
- Responsive design for desktop and mobile

## Tech Stack

- Frontend: React, Vite, Tailwind CSS, Axios, Recharts, React Router
- Backend: Node.js, Express, Mongoose, Zod
- Database: MongoDB
- Authentication: JWT
- Mailer: Nodemailer

## Module Overview

### User Module

- Register and login
- Search PGs and hostels
- View PG details
- Add to wishlist
- Book rooms
- Simulate payment
- Submit reviews
- Send contact message

### Owner Module

- Add new PG listings
- Update and delete own listings
- View owner dashboard
- Track recent bookings and property stats

### Admin Module

- Approve pending PG listings
- View overall platform dashboard
- Manage users
- Manage booking statuses
- Review contact messages

## Project Structure

```text
StayFinder/
|-- client/
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
|-- docs/
|   |-- TEST_CASES.md
|   `-- VIVA_GUIDE.md
`-- README.md
```

## Database Entities

The main collections used in the project are:

- `users`
- `pgs`
- `bookings`
- `payments`
- `contacts`
- `reviews`
- `wishlists`

Important relationships:

- One user can create many bookings
- One owner can create many PG listings
- One PG can have many bookings and reviews
- One booking is linked to one payment

## Main API Routes

### Auth

- `POST /api/auth/register`
- `POST /api/auth/login`
- `GET /api/auth/user`

### PG / Listing

- `GET /api/pg/all`
- `GET /api/pg/:id`
- `GET /api/pg/stats`
- `GET /api/pg/reverse-geocode`

### Owner

- `GET /api/owner/dashboard`
- `GET /api/owner/pgs`
- `POST /api/owner/pgs`
- `PUT /api/owner/pgs/:id`
- `DELETE /api/owner/pgs/:id`
- `GET /api/owner/bookings`

### Booking / Payment

- `POST /api/booking`
- `GET /api/booking/:bookingId/payment`
- `POST /api/booking/:bookingId/payment/process`

### Admin

- `GET /api/admin/dashboard`
- `GET /api/admin/bookings`
- `PATCH /api/admin/bookings/:bookingId/status`
- `GET /api/admin/pgs/pending`
- `PUT /api/admin/approve/:id`
- `GET /api/admin/users`
- `DELETE /api/admin/users/:id`

### Other

- `POST /api/contact`
- `GET /api/contact`
- `POST /api/wishlist/add`
- `DELETE /api/wishlist/:id`
- `POST /api/review/add`

## Local Setup

### Prerequisites

- Node.js 22.x
- MongoDB local instance or MongoDB Atlas
- npm

### Installation

1. Clone the repository.
2. Install backend dependencies:

```powershell
cd server
npm install
```

3. Install frontend dependencies:

```powershell
cd ..\client
npm install
```

4. Create environment files:

- Copy `server/.env.example` to `server/.env`
- Create `client/.env`

### Example Backend Environment

```env
PORT=5000
DB_URI=mongodb://127.0.0.1:27017/stayfinder
JWT_SECRET=replace-with-a-strong-secret
JWT_EXPIRES_IN=7d
CLIENT_ORIGIN=http://localhost:5173
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@example.com
SMTP_PASS=your-app-password
MAIL_FROM="StayFinder <your-email@example.com>"
MAIL_TO=your-email@example.com
```

### Example Frontend Environment

```env
VITE_API_URL=http://localhost:5000
```

### Run the Project

Backend:

```powershell
cd server
npm run dev
```

Frontend:

```powershell
cd client
npm run dev
```

Open:

- Frontend: `http://localhost:5173`
- Backend: `http://localhost:5000`

## Recommended Demo Flow

For project demonstration in class or viva:

1. Login as owner
2. Add a new PG listing
3. Login as admin
4. Approve the PG listing
5. Login as user
6. Search and open the approved PG
7. Book the PG
8. Complete simulated payment
9. Show booking status and dashboard updates
10. Show contact form and admin messages section

## Sample Presentation Points

- Problem Statement: Students and working people need a simple way to find verified PG/hostel accommodation
- Proposed Solution: A role-based platform for listing, moderation, booking, and simulated payment
- Frontend: Responsive React interface for user, owner, and admin
- Backend: Express REST API with validation and role-based middleware
- Database: MongoDB collections for users, listings, bookings, payments, and reviews
- Result: A working multi-role accommodation platform

## Verification Status

Current project checks completed:

- Frontend lint passes with `npm run lint`
- Frontend production build passes with `npm run build`
- Backend controller module checks are loading successfully

Note:

- Vite still shows a large chunk-size warning during build. This does not block project submission, but it can be improved later by code splitting.

## Submission Tips

- Do not submit real database passwords or email passwords publicly
- Use screenshots in your report
- Attach test cases from `docs/TEST_CASES.md`
- Prepare viva answers from `docs/VIVA_GUIDE.md`

## Future Scope

- Real payment gateway integration
- Real-time notifications
- Advanced search and map filters
- Room availability calendar
- Email verification and forgot password
- Online deployment with cloud image storage

## Author

- Project: StayFinder
- Course: BCA Major Project

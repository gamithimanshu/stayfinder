# StayFinder - PG & Hostel Finder System

StayFinder is a full-stack MERN application for discovering, managing, and moderating PG and hostel listings.

## Folder Structure

```text
StayFinder/
├── client/
│   ├── public/
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── store/
│   │   ├── utils/
│   │   ├── App.jsx
│   │   ├── index.css
│   │   └── main.jsx
│   ├── package.json
│   └── vite.config.js
├── server/
│   ├── controllers/
│   ├── middlewares/
│   ├── models/
│   ├── router/
│   ├── uploads/
│   ├── utils/
│   ├── validators/
│   ├── .env.example
│   ├── package.json
│   ├── seed.js
│   └── server.js
└── README.md
```

## Database Schema

- `Users`: stores account details, password hash, role, blocked state, and wishlist count.
- `PgHostel`: stores property info, owner reference, images, amenities, rules, approval status, ratings, and booking counters.
- `Booking`: stores booking lifecycle data between a user and a listing owner.
- `Payment`: stores payment status, method, transaction id, and booking reference.
- `Review`: stores one review per user per listing with rating and comment.
- `Wishlist`: stores user-listing saved combinations.
- `ContactMessages`: stores contact form submissions for admin review.
- `AdminActivityLog`: stores admin-side moderation and monitoring actions.

## Sample Accounts

- Admin: `admin@stayfinder.com` / `Admin@123`
- Owner: `owner@stayfinder.com` / `Owner@123`
- User: `user@stayfinder.com` / `User@123`

## Setup Guide

1. Install backend dependencies:
   - `cd server`
   - `npm install`
2. Install frontend dependencies:
   - `cd ../client`
   - `npm install`
3. Create backend environment file:
   - copy `server/.env.example` to `server/.env`
4. Start MongoDB locally or point `DB_URI` to MongoDB Atlas.
5. Seed sample data:
   - `cd server`
   - `npm run seed`
6. Start the backend:
   - `npm run dev`
7. Start the frontend in another terminal:
   - `cd client`
   - `npm run dev`
8. Open `http://localhost:5173`

## API Overview

- `POST /api/auth/register`
- `POST /api/auth/login`
- `GET /api/auth/me`
- `GET /api/listings`
- `GET /api/listings/featured`
- `GET /api/listings/:id`
- `POST /api/listings`
- `PUT /api/listings/:id`
- `DELETE /api/listings/:id`
- `POST /api/bookings`
- `GET /api/bookings/me`
- `GET /api/bookings/owner`
- `PATCH /api/bookings/:id/status`
- `PATCH /api/bookings/:id/payment`
- `GET /api/wishlist`
- `POST /api/wishlist/:listingId`
- `GET /api/reviews/:listingId`
- `POST /api/reviews/:listingId`
- `POST /api/contact`
- `GET /api/admin/dashboard`
- `GET /api/admin/listings/pending`
- `GET /api/admin/users`
- `GET /api/admin/contacts`
- `GET /api/admin/activity`
- `GET /api/owner/dashboard`

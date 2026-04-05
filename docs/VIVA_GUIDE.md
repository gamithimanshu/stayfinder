# StayFinder Viva Guide

This file contains short viva answers and presentation help for the StayFinder BCA major project.

## 1. What is the title of your project?

StayFinder is a PG and hostel management and booking platform built using the MERN stack.

## 2. What problem does your project solve?

It helps students and working professionals find verified PG and hostel accommodation while also helping owners manage listings and admins moderate the platform.

## 3. Why did you choose this topic?

Accommodation search is a common real-world problem. This topic allowed me to build a practical project with real user flows such as authentication, listing management, booking, reviews, and admin approval.

## 4. What technologies did you use?

- React for frontend
- Vite for frontend tooling
- Tailwind CSS for styling
- Node.js and Express for backend
- MongoDB with Mongoose for database
- JWT for authentication
- Nodemailer for email support

## 5. Why did you choose MongoDB?

MongoDB is flexible and works well with JavaScript-based full-stack projects. It is useful for storing user, PG, booking, and review data in a document-oriented format.

## 6. What is MERN stack?

MERN stands for MongoDB, Express, React, and Node.js. It is a JavaScript-based full-stack development stack.

## 7. What roles are available in your system?

There are three roles:

- User
- Owner
- Admin

## 8. What can a normal user do?

A user can register, login, search PGs, view details, add wishlist items, make bookings, simulate payments, submit reviews, and send contact messages.

## 9. What can an owner do?

An owner can add PG listings, edit or delete them, and view owner dashboard insights and bookings related to their properties.

## 10. What can an admin do?

An admin can approve listings, manage users, track bookings, check dashboard analytics, and review contact messages.

## 11. How is authentication implemented?

Authentication is implemented using JWT. When the user logs in, the server generates a token, and the frontend stores it and sends it with protected API requests.

## 12. How did you implement authorization?

Authorization is role-based. Middleware checks whether the logged-in user is an admin, owner, or normal user before allowing access to protected routes.

## 13. What collections/tables are used?

Main collections:

- Users
- PGs
- Bookings
- Payments
- Contacts
- Reviews
- Wishlists

## 14. Explain the booking flow.

The user selects a PG, creates a booking with check-in date and duration, then moves to the payment page where payment status is simulated and booking status is updated accordingly.

## 15. Is real payment integrated?

No. Payment is currently simulated for educational/project purposes, but the code structure is ready for future real gateway integration.

## 16. How is validation handled?

Backend validation is handled using Zod schemas. Frontend forms also have validation for required fields and basic constraints.

## 17. What is the purpose of the admin dashboard?

The admin dashboard gives a summary of users, messages, revenue, bookings, pending PG approvals, and recent platform activity.

## 18. What is the purpose of the owner dashboard?

The owner dashboard helps owners monitor their listings, available rooms, bookings, and performance data.

## 19. How is responsiveness handled?

The frontend uses Tailwind CSS responsive utilities, reusable layout components, and overflow handling for tables and cards.

## 20. What are the limitations of your project?

- Real payment gateway is not integrated
- Image storage is simple and can be improved
- Real-time notifications are not added
- Advanced search/map filtering can be improved

## 21. What future improvements can be added?

- Real payment integration
- OTP/email verification
- Cloud image upload
- Real-time notifications
- Better recommendation system
- Geo-based advanced search

## 22. What did you learn from this project?

I learned full-stack development, API design, MongoDB relations, authentication, role-based access control, responsive UI design, and project structuring for real workflows.

## 23. Why is this a major-project-level application?

Because it includes:

- multiple user roles
- frontend and backend integration
- CRUD operations
- validation
- dashboards
- booking and payment workflow
- admin approval flow
- database design

## 24. How should you explain the project in 1 minute?

StayFinder is a MERN-based accommodation platform where users can search and book PGs, owners can list and manage properties, and admins can approve listings and monitor platform activity. It includes authentication, booking, payment simulation, dashboards, reviews, and contact management.

## PPT Outline

Use this structure for your project presentation:

1. Title slide
2. Problem statement
3. Objectives
4. Technology stack
5. System architecture
6. Database collections/models
7. User module
8. Owner module
9. Admin module
10. Booking and payment flow
11. Screenshots/demo
12. Test cases
13. Future scope
14. Conclusion

## Demo Order for Viva

1. Open home page
2. Register/login
3. Show PG listing page
4. Show PG detail page
5. Create booking
6. Show payment simulation
7. Login as owner and show add/manage PG
8. Login as admin and show approval + users + bookings
9. Show contact form and message visibility

## Important Submission Advice

- Do not show real passwords or private credentials
- Keep `.env` secrets private
- Use screenshots and test-case evidence in report
- Be ready to explain each module clearly

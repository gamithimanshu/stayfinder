const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
require("./utils/load-env");

const authRouter = require("./router/auth-router");
const pgRouter = require("./router/pg-router");
const bookingRouter = require("./router/booking-router");
const userRouter = require("./router/user-router");
const ownerRouter = require("./router/owner-router");
const adminRouter = require("./router/admin-router");
const contactRouter = require("./router/contact-router");
const wishlistRouter = require("./router/wishlist-router");
const reviewRouter = require("./router/review-router");
const errorMiddleware = require("./middlewares/error-middleware");

const app = express();

app.use(
  cors({
    origin: process.env.CLIENT_ORIGIN || true,
    methods: ["GET", "HEAD", "PUT", "PATCH", "POST", "DELETE"],
  })
);

// Security headers similar to TicketHub.
// We explicitly disable CORP because your client uses the API cross-origin.
app.use(helmet({ crossOriginResourcePolicy: false }));

app.use(express.json());

app.use("/api/auth", authRouter);
app.use("/api/pg", pgRouter);
app.use("/api/booking", bookingRouter);
app.use("/api/user", userRouter);
app.use("/api/owner", ownerRouter);
app.use("/api/admin", adminRouter);
app.use("/api/contact", contactRouter);
app.use("/api/wishlist", wishlistRouter);
app.use("/api/review", reviewRouter);

app.use(errorMiddleware);

module.exports = app;

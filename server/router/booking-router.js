const express = require("express");
const {
  createBooking,
  getBookingPayment,
  processBookingPayment,
} = require("../controllers/booking-controller");
const authMiddleware = require("../middlewares/auth-middleware");
const validate = require("../middlewares/validate-middleware");
const { bookingSchema } = require("../validators/booking-validator");

const router = express.Router();

router.route("/create").post(authMiddleware, validate(bookingSchema), createBooking);
router.route("/").post(authMiddleware, validate(bookingSchema), createBooking);
router.route("/:bookingId/payment").get(authMiddleware, getBookingPayment);
router.route("/:bookingId/payment/process").post(authMiddleware, processBookingPayment);

module.exports = router;

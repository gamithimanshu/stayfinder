const Booking = require("../models/booking-model");
const Payment = require("../models/payment-model");
const Pg = require("../models/pg-model");

const ensureBookingAccess = (booking, userId, userRole) => {
  if (!booking) return false;
  if (String(booking.userId?._id || booking.userId) === String(userId)) return true;
  return userRole === "admin";
};

const createBooking = async (req, res, next) => {
  try {
    const { pgId, checkInDate, durationMonths, paymentMethod } = req.body;
    const normalizedDuration = Number(durationMonths);
    const normalizedPaymentMethod = String(paymentMethod || "pay_at_property").trim();

    const pg = await Pg.findOne({ _id: pgId, isApproved: true });
    if (!pg) {
      return res.status(404).json({ message: "PG not found" });
    }

    if (pg.availableRooms < 1) {
      return res.status(400).json({ message: "No rooms available for this PG" });
    }

    const totalAmount = pg.price * normalizedDuration;

    const booking = await Booking.create({
      userId: req.userId,
      pgId: pg._id,
      checkInDate,
      durationMonths: normalizedDuration,
      totalAmount,
      paymentStatus: "pending",
      bookingStatus: "confirmed",
    });

    await Payment.create({
      bookingId: booking._id,
      amount: totalAmount,
      paymentMethod: normalizedPaymentMethod,
      paymentStatus: "pending",
    });

    pg.availableRooms -= 1;
    await pg.save();

    return res.status(201).json({
      message: "Booking created successfully",
      booking,
      payment: {
        status: "pending",
        method: normalizedPaymentMethod,
      },
      pg: {
        _id: pg._id,
        title: pg.title,
        availableRooms: pg.availableRooms,
      },
    });
  } catch (error) {
    if (error.name === "CastError") {
      return res.status(404).json({ message: "PG not found" });
    }
    return next(error);
  }
};

const getBookingPayment = async (req, res, next) => {
  try {
    const { bookingId } = req.params;

    const booking = await Booking.findById(bookingId)
      .populate("pgId")
      .populate("userId", "name username email phone");

    if (!ensureBookingAccess(booking, req.userId, req.userRole)) {
      return res.status(404).json({ message: "Booking not found" });
    }

    const payment = await Payment.findOne({ bookingId: booking._id });

    return res.status(200).json({
      booking,
      payment,
      pg: booking.pgId,
    });
  } catch (error) {
    if (error.name === "CastError") {
      return res.status(404).json({ message: "Booking not found" });
    }
    return next(error);
  }
};

const processBookingPayment = async (req, res, next) => {
  try {
    const { bookingId } = req.params;
    const { paymentMethod, payerDetails = {}, markAs = "success" } = req.body;

    const booking = await Booking.findById(bookingId);
    if (!ensureBookingAccess(booking, req.userId, req.userRole)) {
      return res.status(404).json({ message: "Booking not found" });
    }

    const payment = await Payment.findOne({ bookingId: booking._id });
    if (!payment) {
      return res.status(404).json({ message: "Payment not found for this booking" });
    }

    const nextStatus = markAs === "failed" ? "failed" : "paid";
    const normalizedMethod = String(paymentMethod || payment.paymentMethod || "manual").trim();
    const generatedTransactionId =
      nextStatus === "paid"
        ? `SIM-${Date.now()}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`
        : "";

    payment.paymentMethod = normalizedMethod;
    payment.paymentStatus = nextStatus;
    payment.transactionId = generatedTransactionId;
    await payment.save();

    booking.paymentStatus = nextStatus;
    await booking.save();

    return res.status(200).json({
      message:
        nextStatus === "paid"
          ? "Payment completed successfully"
          : "Payment attempt recorded as failed",
      booking,
      payment,
      payerDetails,
    });
  } catch (error) {
    if (error.name === "CastError") {
      return res.status(404).json({ message: "Booking not found" });
    }
    return next(error);
  }
};

module.exports = { createBooking, getBookingPayment, processBookingPayment };

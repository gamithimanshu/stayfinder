const Booking = require("../models/booking-model");
const Payment = require("../models/payment-model");
const Pg = require("../models/pg-model");

const PAYMENT_METHODS = new Set(["upi", "card", "net_banking", "pay_at_property"]);

const ensureBookingAccess = (booking, userId, userRole) => {
  if (!booking) return false;
  if (String(booking.userId?._id || booking.userId) === String(userId)) return true;
  return userRole === "admin";
};

const adjustPgAvailability = async (pgId, delta) => {
  if (!delta) return null;

  const pg = await Pg.findById(pgId);
  if (!pg) return null;

  const totalRooms = Number(pg.totalRooms || 0);
  const currentAvailableRooms = Number(pg.availableRooms || 0);
  const maxRooms = totalRooms > 0 ? totalRooms : currentAvailableRooms;

  pg.availableRooms = Math.min(Math.max(currentAvailableRooms + Number(delta), 0), maxRooms);
  await pg.save();

  return pg;
};

const createBooking = async (req, res, next) => {
  let createdBooking = null;
  let createdPayment = null;

  try {
    const { pgId, checkInDate, durationMonths, paymentMethod } = req.body;
    const normalizedDuration = Number(durationMonths);
    const parsedCheckInDate = new Date(checkInDate);
    const requestedMethod = String(paymentMethod || "").trim();
    const normalizedPaymentMethod = PAYMENT_METHODS.has(requestedMethod)
      ? requestedMethod
      : "pay_at_property";

    if (!Number.isInteger(normalizedDuration) || normalizedDuration < 1) {
      return res.status(400).json({ message: "Booking duration must be at least 1 month" });
    }

    if (Number.isNaN(parsedCheckInDate.getTime())) {
      return res.status(400).json({ message: "Enter a valid check-in date" });
    }

    const pg = await Pg.findOne({ _id: pgId, isApproved: true });
    if (!pg) {
      return res.status(404).json({ message: "PG not found" });
    }

    if (pg.availableRooms < 1) {
      return res.status(400).json({ message: "No rooms available for this PG" });
    }

    const totalAmount = pg.price * normalizedDuration;

    createdBooking = await Booking.create({
      userId: req.userId,
      pgId: pg._id,
      checkInDate: parsedCheckInDate,
      durationMonths: normalizedDuration,
      totalAmount,
      paymentStatus: "pending",
      bookingStatus: "confirmed",
    });

    createdPayment = await Payment.create({
      bookingId: createdBooking._id,
      amount: totalAmount,
      paymentMethod: normalizedPaymentMethod,
      paymentStatus: "pending",
    });

    pg.availableRooms -= 1;
    await pg.save();

    return res.status(201).json({
      message: "Booking created successfully",
      booking: createdBooking,
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
    if (createdPayment?._id) {
      await Payment.findByIdAndDelete(createdPayment._id).catch(() => null);
    }

    if (createdBooking?._id) {
      await Booking.findByIdAndDelete(createdBooking._id).catch(() => null);
    }

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

    if (booking.bookingStatus === "cancelled") {
      return res.status(400).json({ message: "This booking is no longer active" });
    }

    const requestedMethod = String(paymentMethod || "").trim();
    const normalizedMethod = PAYMENT_METHODS.has(requestedMethod)
      ? requestedMethod
      : String(payment.paymentMethod || "pay_at_property").trim();
    const action = String(markAs || "success").trim().toLowerCase();
    const isPayLaterReservation = normalizedMethod === "pay_at_property" && action !== "failed";

    let nextStatus = "paid";
    let nextBookingStatus = "confirmed";
    let generatedTransactionId = "";
    let updatedPg = null;

    if (action === "failed") {
      nextStatus = "failed";
      nextBookingStatus = "cancelled";
      updatedPg = await adjustPgAvailability(booking.pgId, 1);
    } else if (isPayLaterReservation) {
      nextStatus = "pending";
      nextBookingStatus = "confirmed";
      generatedTransactionId = `PAY-LATER-${booking._id.toString().slice(-6).toUpperCase()}`;
    } else {
      generatedTransactionId = `SIM-${Date.now()}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
    }

    payment.paymentMethod = normalizedMethod;
    payment.paymentStatus = nextStatus;
    payment.transactionId = generatedTransactionId;
    await payment.save();

    booking.paymentStatus = nextStatus;
    booking.bookingStatus = nextBookingStatus;
    await booking.save();

    return res.status(200).json({
      message: isPayLaterReservation
        ? "Booking confirmed with pay later. Collect payment at the property."
        : nextStatus === "paid"
          ? "Payment completed successfully"
          : "Payment failed and the reserved room has been released",
      booking,
      payment,
      payerDetails,
      pg: updatedPg
        ? {
            _id: updatedPg._id,
            title: updatedPg.title,
            availableRooms: updatedPg.availableRooms,
          }
        : undefined,
    });
  } catch (error) {
    if (error.name === "CastError") {
      return res.status(404).json({ message: "Booking not found" });
    }
    return next(error);
  }
};

module.exports = { createBooking, getBookingPayment, processBookingPayment };

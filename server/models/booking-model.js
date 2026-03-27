const mongoose = require("mongoose");

const bookingSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    pgId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "PG",
      required: true,
      index: true,
    },
    checkInDate: { type: Date, required: true },
    durationMonths: { type: Number, required: true, min: 1 },
    totalAmount: { type: Number, required: true, min: 0 },
    paymentStatus: {
      type: String,
      enum: ["pending", "paid", "failed"],
      default: "pending",
      trim: true,
    },
    bookingStatus: {
      type: String,
      enum: ["pending", "confirmed", "cancelled"],
      default: "pending",
    },
  },
  {
    timestamps: true,
    collection: "bookings",
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

bookingSchema.virtual("user")
  .get(function getUser() {
    return this.userId;
  })
  .set(function setUser(value) {
    this.userId = value;
  });

bookingSchema.virtual("pg")
  .get(function getPg() {
    return this.pgId;
  })
  .set(function setPg(value) {
    this.pgId = value;
  });

bookingSchema.virtual("totalPrice")
  .get(function getTotalPrice() {
    return this.totalAmount;
  })
  .set(function setTotalPrice(value) {
    this.totalAmount = value;
  });

bookingSchema.virtual("status")
  .get(function getStatus() {
    return this.bookingStatus;
  })
  .set(function setStatus(value) {
    this.bookingStatus = value;
  });

module.exports = mongoose.models.Booking || mongoose.model("Booking", bookingSchema);

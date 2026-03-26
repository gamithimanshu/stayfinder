const AdminLog = require("../models/admin-log-model");
const Pg = require("../models/pg-model");
const Review = require("../models/review-model");
const User = require("../models/user-models");
const Wishlist = require("../models/wishlist-model");
const Booking = require("../models/booking-model");
const Payment = require("../models/payment-model");
const { getPlatformDashboard } = require("../utils/dashboard-analytics");

const getAdminDashboard = async (req, res, next) => {
  try {
    const dashboard = await getPlatformDashboard();
    return res.status(200).json(dashboard);
  } catch (error) {
    return next(error);
  }
};

const getPendingPgs = async (req, res, next) => {
  try {
    const pgs = await Pg.find({ isApproved: false })
      .populate("ownerId", "name email phone role isAdmin")
      .sort({ createdAt: -1 });

    return res.status(200).json({ pgs });
  } catch (error) {
    return next(error);
  }
};

const approvePg = async (req, res, next) => {
  try {
    const pg = await Pg.findByIdAndUpdate(
      req.params.id,
      { isApproved: true },
      { new: true }
    ).populate("ownerId", "name email role isAdmin");

    if (!pg) {
      return res.status(404).json({ message: "PG not found" });
    }

    await AdminLog.create({
      adminId: req.userId,
      action: `Approved PG ${pg._id}`,
    });

    return res.status(200).json({
      message: "PG approved successfully",
      pg,
    });
  } catch (error) {
    if (error.name === "CastError") {
      return res.status(404).json({ message: "PG not found" });
    }

    return next(error);
  }
};

const getUsers = async (req, res, next) => {
  try {
    const users = await User.find().select("-password").sort({ createdAt: -1 });
    return res.status(200).json({ users });
  } catch (error) {
    return next(error);
  }
};

const deleteUser = async (req, res, next) => {
  try {
    const userId = req.params.id;

    if (String(req.userId) === String(userId)) {
      return res.status(400).json({ message: "You cannot delete your own admin account" });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const ownerPgs = await Pg.find({ ownerId: userId }).select("_id");
    const ownerPgIds = ownerPgs.map((pg) => pg._id);
    const userBookingIds = await Booking.find({ userId }).distinct("_id");
    const ownerBookingIds = ownerPgIds.length
      ? await Booking.find({ pgId: { $in: ownerPgIds } }).distinct("_id")
      : [];

    await Promise.all([
      userBookingIds.length ? Payment.deleteMany({ bookingId: { $in: userBookingIds } }) : Promise.resolve(),
      Booking.deleteMany({ userId: userId }),
      Wishlist.deleteMany({ userId: userId }),
      Review.deleteMany({ userId: userId }),
      ownerBookingIds.length ? Payment.deleteMany({ bookingId: { $in: ownerBookingIds } }) : Promise.resolve(),
      ownerPgIds.length ? Booking.deleteMany({ pgId: { $in: ownerPgIds } }) : Promise.resolve(),
      ownerPgIds.length ? Wishlist.deleteMany({ pgId: { $in: ownerPgIds } }) : Promise.resolve(),
      ownerPgIds.length ? Review.deleteMany({ pgId: { $in: ownerPgIds } }) : Promise.resolve(),
      Pg.deleteMany({ ownerId: userId }),
      User.findByIdAndDelete(userId),
    ]);

    await AdminLog.create({
      adminId: req.userId,
      action: `Deleted user ${userId}`,
    });

    return res.status(200).json({ message: "User deleted successfully" });
  } catch (error) {
    if (error.name === "CastError") {
      return res.status(404).json({ message: "User not found" });
    }

    return next(error);
  }
};

module.exports = {
  getAdminDashboard,
  getPendingPgs,
  approvePg,
  getUsers,
  deleteUser,
};

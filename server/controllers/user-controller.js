const mongoose = require("mongoose");
const Booking = require("../models/booking-model");
const User = require("../models/user-models");
const createHttpError = require("../utils/app-error");

const safeNumber = (value) => {
  const number = Number(value ?? 0);
  return Number.isFinite(number) ? number : 0;
};

const getProfile = async (req, res, next) => {
  try {
    return res.status(200).json({
      message: "Profile retrieved successfully",
      user: req.user,
    });
  } catch (error) {
    return next(error);
  }
};

const updateProfile = async (req, res, next) => {
  try {
    const {
      name,
      username,
      email,
      phone,
      profileImage,
      currentPassword,
      newPassword,
    } = req.body;

    const user = await User.findById(req.userId).select("+password");
    if (!user) {
      return next(createHttpError(404, "User not found"));
    }

    const normalizedEmail = email.trim().toLowerCase();
    if (normalizedEmail !== user.email) {
      const existingUser = await User.findOne({ email: normalizedEmail });
      if (existingUser) {
        return next(createHttpError(409, "Email already exists"));
      }
    }

    user.name = (name || username || "").trim();
    user.email = normalizedEmail;
    user.phone = phone.trim();
    user.profileImage = String(profileImage || "").trim();

    if (newPassword) {
      const isPasswordValid = await user.comparePassword(currentPassword);
      if (!isPasswordValid) {
        return next(createHttpError(401, "Current password is incorrect"));
      }
      user.password = newPassword;
    }

    await user.save();

    const userResponse = await User.findById(user._id).select({ password: 0 });

    return res.status(200).json({
      message: "Profile updated successfully",
      user: userResponse,
    });
  } catch (error) {
    if (error.code === 11000) {
      return next(createHttpError(409, "Email already exists"));
    }
    return next(error);
  }
};

const getUserBookings = async (req, res, next) => {
  try {
    const bookings = await Booking.aggregate([
      {
        $match: {
          userId: new mongoose.Types.ObjectId(req.userId),
        },
      },
      {
        $lookup: {
          from: "payments",
          let: { bookingId: "$_id" },
          pipeline: [
            {
              $match: {
                $expr: { $eq: ["$bookingId", "$$bookingId"] },
              },
            },
            { $sort: { createdAt: -1 } },
            { $limit: 1 },
          ],
          as: "payment",
        },
      },
      {
        $unwind: {
          path: "$payment",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $lookup: {
          from: "pgs",
          localField: "pgId",
          foreignField: "_id",
          as: "pg",
        },
      },
      {
        $unwind: {
          path: "$pg",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $sort: { createdAt: -1 },
      },
      {
        $project: {
          _id: 1,
          checkInDate: 1,
          durationMonths: 1,
          bookingStatus: 1,
          paymentStatus: {
            $ifNull: ["$payment.paymentStatus", "$paymentStatus"],
          },
          totalAmount: { $ifNull: ["$totalAmount", 0] },
          createdAt: 1,
          paymentMethod: "$payment.paymentMethod",
          transactionId: "$payment.transactionId",
          pg: {
            _id: "$pg._id",
            title: "$pg.title",
            city: "$pg.city",
            area: "$pg.area",
            address: "$pg.address",
            image: {
              $ifNull: ["$pg.image", { $arrayElemAt: ["$pg.images", 0] }],
            },
          },
        },
      },
    ]);

    return res.status(200).json({
      message: "Booking history retrieved successfully",
      bookings: bookings.map((booking) => ({
        ...booking,
        totalAmount: safeNumber(booking.totalAmount),
      })),
    });
  } catch (error) {
    return next(error);
  }
};

module.exports = { getProfile, updateProfile, getUserBookings };

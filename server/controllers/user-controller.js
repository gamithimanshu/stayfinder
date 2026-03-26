const User = require("../models/user-models");
const createHttpError = require("../utils/app-error");

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

module.exports = { getProfile, updateProfile };

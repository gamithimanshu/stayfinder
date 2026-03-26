const User = require("../models/user-models");
const createHttpError = require("../utils/app-error");

const sanitizeUser = (user) => {
  if (!user) return null;

  const plainUser = typeof user.toObject === "function" ? user.toObject() : { ...user };
  delete plainUser.password;
  if (plainUser.isAdmin) {
    plainUser.role = "admin";
  }
  return plainUser;
};

const home = async (req, res, next) => {
  try {
    return res.status(200).json({ msg: "Welcome to our home page" });
  } catch (error) {
    return next(error);
  }
};

const register = async (req, res, next) => {
  try {
    const { username, name, email, phone, password, role, profileImage } = req.body;
    const normalizedEmail = email.trim().toLowerCase();
    const normalizedRole = role === "owner" ? "owner" : "user";

    const userExist = await User.findOne({ email: normalizedEmail });
    if (userExist) {
      return next(createHttpError(409, "Email already exists"));
    }

    const userCreated = await User.create({
      name: (name || username || "").trim(),
      email: normalizedEmail,
      phone: phone?.trim() ?? "",
      password,
      role: normalizedRole,
      profileImage: profileImage?.trim() ?? "",
    });

    return res.status(201).json({
      message: "Registration Successful",
      userId: userCreated._id.toString(),
      token: await userCreated.generateToken(),
      user: sanitizeUser(userCreated),
    });
  } catch (error) {
    if (error.code === 11000) {
      return next(createHttpError(409, "Email already exists"));
    }
    return next(error);
  }
};

const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const normalizedEmail = email.trim().toLowerCase();

    const userExist = await User.findOne({ email: normalizedEmail }).select(
      "+password"
    );

    if (!userExist) {
      return next(createHttpError(401, "Invalid credentials"));
    }

    const isPasswordValid = await userExist.comparePassword(password);
    if (!isPasswordValid) {
      return next(createHttpError(401, "Invalid credentials"));
    }

    return res.status(200).json({
      message: "Login Successful",
      token: await userExist.generateToken(),
      userId: userExist._id.toString(),
      user: sanitizeUser(userExist),
    });
  } catch (error) {
    return next(error);
  }
};

const user = async (req, res, next) => {
  try {
    return res.status(200).json({
      msg: "User data retrieved successfully",
      user: req.user,
    });
  } catch (error) {
    return next(error);
  }
};

module.exports = { home, register, login, user };

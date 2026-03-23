const User = require("../models/user-models");

const createHttpError = (status, message, details = []) => {
  const error = new Error(message);
  error.status = status;
  error.details = details;
  return error;
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
    const { username, email, phone, password } = req.body;
    const normalizedEmail = email.trim().toLowerCase();

    const userExist = await User.findOne({ email: normalizedEmail });
    if (userExist) {
      return next(createHttpError(409, "Email already exists"));
    }

    const userCreated = await User.create({
      username,
      email: normalizedEmail,
      phone,
      password,
    });

    return res.status(201).json({
      message: "Registration Successful",
      userId: userCreated._id.toString(),
      token: await userCreated.generateToken(),
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

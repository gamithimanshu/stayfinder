const jwt = require("jsonwebtoken");
const User = require("../models/user-models");

const authMiddleware = async (req, res, next) => {
  const authHeader = req.header("Authorization") || "";
  const token = authHeader.replace("Bearer ", "").trim();

  if (!token) {
    return res.status(401).json({ message: "Unauthorized: No token provided" });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const userData = await User.findById(decoded.userId).select({ password: 0 });

    if (!userData) {
      return res.status(401).json({ message: "Unauthorized: User not found" });
    }

    if (userData.isAdmin && userData.role !== "admin") {
      userData.role = "admin";
    }

    req.user = userData;
    req.token = token;
    req.userId = userData._id;
    req.userRole = userData.role || (userData.isAdmin ? "admin" : "user");
    return next();
  } catch (error) {
    return res.status(401).json({ message: "Unauthorized: Invalid token" });
  }
};

module.exports = authMiddleware;

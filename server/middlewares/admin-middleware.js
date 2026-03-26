const adminMiddleware = (req, res, next) => {
  if (req.user?.role !== "admin" && !req.user?.isAdmin) {
    return res.status(403).json({ message: "Forbidden: Admin access required" });
  }

  return next();
};

module.exports = adminMiddleware;

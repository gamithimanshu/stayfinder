const express = require("express");
const authMiddleware = require("../middlewares/auth-middleware");
const adminMiddleware = require("../middlewares/admin-middleware");
const {
  approvePg,
  deleteUser,
  getAdminBookings,
  getAdminDashboard,
  getPendingPgs,
  getUsers,
  updateBookingStatus,
} = require("../controllers/admin-controller");

const router = express.Router();

router.use(authMiddleware, adminMiddleware);

router.route("/dashboard").get(getAdminDashboard);
router.route("/bookings").get(getAdminBookings);
router.route("/bookings/:id/status").patch(updateBookingStatus);
router.route("/pgs/pending").get(getPendingPgs);
router.route("/approve/:id").put(approvePg);
router.route("/users").get(getUsers);
router.route("/users/:id").delete(deleteUser);

module.exports = router;

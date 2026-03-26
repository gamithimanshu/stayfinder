const express = require("express");
const authMiddleware = require("../middlewares/auth-middleware");
const validate = require("../middlewares/validate-middleware");
const {
  createOwnerPg,
  deleteOwnerPg,
  getOwnerBookings,
  getOwnerDashboard,
  getOwnerPgs,
  updateOwnerPg,
} = require("../controllers/owner-controller");
const { ownerPgSchema } = require("../validators/owner-validator");

const router = express.Router();

router.use(authMiddleware);
router.route("/dashboard").get(getOwnerDashboard);
router.route("/pgs").get(getOwnerPgs).post(validate(ownerPgSchema), createOwnerPg);
router.route("/pgs/:id").put(validate(ownerPgSchema), updateOwnerPg).delete(deleteOwnerPg);
router.route("/bookings").get(getOwnerBookings);

module.exports = router;

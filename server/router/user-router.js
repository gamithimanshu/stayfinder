const express = require("express");
const authMiddleware = require("../middlewares/auth-middleware");
const validate = require("../middlewares/validate-middleware");
const { getProfile, updateProfile } = require("../controllers/user-controller");
const { updateProfileSchema } = require("../validators/user-validator");

const router = express.Router();

router.route("/profile").get(authMiddleware, getProfile);
router.route("/update").put(authMiddleware, validate(updateProfileSchema), updateProfile);

module.exports = router;

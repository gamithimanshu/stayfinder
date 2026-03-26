const express = require("express");
const authMiddleware = require("../middlewares/auth-middleware");
const validate = require("../middlewares/validate-middleware");
const { addReview, getReviewSummary, getReviewsByPg } = require("../controllers/review-controller");
const { reviewSchema } = require("../validators/review-validator");

const router = express.Router();

router.route("/summary").get(getReviewSummary);
router.route("/:pgId").get(getReviewsByPg);
router.route("/add").post(authMiddleware, validate(reviewSchema), addReview);

module.exports = router;

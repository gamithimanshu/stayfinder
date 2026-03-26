const express = require("express");
const authMiddleware = require("../middlewares/auth-middleware");
const validate = require("../middlewares/validate-middleware");
const { addToWishlist, getWishlist, removeFromWishlist } = require("../controllers/wishlist-controller");
const { wishlistSchema } = require("../validators/wishlist-validator");

const router = express.Router();

router.use(authMiddleware);
router.route("/").get(getWishlist);
router.route("/add").post(validate(wishlistSchema), addToWishlist);
router.route("/").post(validate(wishlistSchema), addToWishlist);
router.route("/:id").delete(removeFromWishlist);

module.exports = router;

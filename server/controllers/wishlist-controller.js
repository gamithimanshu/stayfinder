const Pg = require("../models/pg-model");
const Wishlist = require("../models/wishlist-model");

const getWishlist = async (req, res, next) => {
  try {
    const wishlist = await Wishlist.find({ userId: req.userId })
      .populate({
        path: "pgId",
        match: { isApproved: true },
      })
      .sort({ createdAt: -1 });

    return res.status(200).json({
      wishlist: wishlist.filter((item) => item.pg),
    });
  } catch (error) {
    return next(error);
  }
};

const addToWishlist = async (req, res, next) => {
  try {
    const pg = await Pg.findOne({ _id: req.body.pgId, isApproved: true });
    if (!pg) {
      return res.status(404).json({ message: "PG not found" });
    }

    const existing = await Wishlist.findOne({ userId: req.userId, pgId: pg._id });
    if (existing) {
      return res.status(200).json({
        message: "PG is already in wishlist",
        wishlist: existing,
      });
    }

    const wishlist = await Wishlist.create({
      userId: req.userId,
      pgId: pg._id,
    });

    return res.status(201).json({
      message: "Added to wishlist successfully",
      wishlist,
    });
  } catch (error) {
    if (error.name === "CastError") {
      return res.status(404).json({ message: "PG not found" });
    }

    return next(error);
  }
};

const removeFromWishlist = async (req, res, next) => {
  try {
    const wishlist = await Wishlist.findOneAndDelete({
      _id: req.params.id,
      userId: req.userId,
    });

    if (!wishlist) {
      return res.status(404).json({ message: "Wishlist item not found" });
    }

    return res.status(200).json({ message: "Removed from wishlist successfully" });
  } catch (error) {
    if (error.name === "CastError") {
      return res.status(404).json({ message: "Wishlist item not found" });
    }

    return next(error);
  }
};

module.exports = {
  getWishlist,
  addToWishlist,
  removeFromWishlist,
};

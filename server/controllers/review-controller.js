const Pg = require("../models/pg-model");
const Review = require("../models/review-model");

const getReviewSummary = async (_req, res, next) => {
  try {
    const [summary] = await Review.aggregate([
      {
        $group: {
          _id: null,
          totalReviews: { $sum: 1 },
          averageRating: { $avg: "$rating" },
          fiveStarCount: {
            $sum: { $cond: [{ $eq: ["$rating", 5] }, 1, 0] },
          },
          fourStarCount: {
            $sum: { $cond: [{ $eq: ["$rating", 4] }, 1, 0] },
          },
          threeStarCount: {
            $sum: { $cond: [{ $eq: ["$rating", 3] }, 1, 0] },
          },
          twoStarCount: {
            $sum: { $cond: [{ $eq: ["$rating", 2] }, 1, 0] },
          },
          oneStarCount: {
            $sum: { $cond: [{ $eq: ["$rating", 1] }, 1, 0] },
          },
        },
      },
    ]);

    const totalReviews = Number(summary?.totalReviews || 0);
    const averageRating = totalReviews
      ? Number(Number(summary.averageRating || 0).toFixed(1))
      : null;

    const breakdown = [
      { label: "5 star reviews", count: Number(summary?.fiveStarCount || 0), rating: 5 },
      { label: "4 star reviews", count: Number(summary?.fourStarCount || 0), rating: 4 },
      { label: "3 star reviews", count: Number(summary?.threeStarCount || 0), rating: 3 },
      { label: "2 star reviews", count: Number(summary?.twoStarCount || 0), rating: 2 },
      { label: "1 star reviews", count: Number(summary?.oneStarCount || 0), rating: 1 },
    ].map((item) => ({
      ...item,
      percentage: totalReviews ? Math.round((item.count / totalReviews) * 100) : 0,
    }));

    return res.status(200).json({
      stats: {
        averageRating,
        totalReviews,
        breakdown,
      },
    });
  } catch (error) {
    return next(error);
  }
};

const getReviewsByPg = async (req, res, next) => {
  try {
    const reviews = await Review.find({ pgId: req.params.pgId }).sort({ createdAt: -1 });
    return res.status(200).json({ reviews });
  } catch (error) {
    if (error.name === "CastError") {
      return res.status(404).json({ message: "PG not found" });
    }

    return next(error);
  }
};

const addReview = async (req, res, next) => {
  try {
    const pg = await Pg.findOne({ _id: req.body.pgId, isApproved: true });
    if (!pg) {
      return res.status(404).json({ message: "PG not found" });
    }

    const name = req.user?.name || req.user?.username || req.user?.email || "Resident";

    const review = await Review.findOneAndUpdate(
      { userId: req.userId, pgId: pg._id },
      {
        userId: req.userId,
        pgId: pg._id,
        name,
        rating: Number(req.body.rating),
        comment: req.body.comment.trim(),
      },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    );

    const reviews = await Review.find({ pgId: pg._id }).sort({ createdAt: -1 });
    pg.reviews = reviews.map((item) => ({
      name: item.name,
      rating: item.rating,
      comment: item.comment,
    }));
    await pg.save();

    return res.status(201).json({
      message: "Review saved successfully",
      review,
      reviews,
    });
  } catch (error) {
    if (error.name === "CastError") {
      return res.status(404).json({ message: "PG not found" });
    }

    return next(error);
  }
};

module.exports = {
  getReviewSummary,
  getReviewsByPg,
  addReview,
};

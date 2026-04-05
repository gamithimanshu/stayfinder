const Pg = require("../models/pg-model");
const Booking = require("../models/booking-model");
const Review = require("../models/review-model");
const User = require("../models/user-models");
const Contact = require("../models/contact-model");

const resolvePublicPgFilter = async () => ({ isApproved: true });

const buildReviewStatsMap = async (pgIds = []) => {
  const safePgIds = Array.isArray(pgIds) ? pgIds.filter(Boolean) : [];

  if (safePgIds.length === 0) {
    return new Map();
  }

  const reviewSummaries = await Review.aggregate([
    {
      $match: {
        pgId: { $in: safePgIds },
      },
    },
    {
      $group: {
        _id: "$pgId",
        reviewCount: { $sum: 1 },
        averageRating: { $avg: "$rating" },
      },
    },
  ]);

  return new Map(
    reviewSummaries.map((item) => [
      String(item._id),
      {
        reviewCount: Number(item.reviewCount || 0),
        averageRating: Number.isFinite(Number(item.averageRating))
          ? Number(Number(item.averageRating).toFixed(1))
          : 0,
      },
    ])
  );
};

const listAllPgs = async (req, res, next) => {
  try {
    const { city = "", price = "", gender = "" } = req.query;
    const query = { ...(await resolvePublicPgFilter()) };

    if (city.trim()) {
      query.$or = [
        { city: { $regex: city.trim(), $options: "i" } },
        { area: { $regex: city.trim(), $options: "i" } },
        { address: { $regex: city.trim(), $options: "i" } },
      ];
    }

    if (gender.trim()) {
      query.gender = { $regex: `^${gender.trim()}`, $options: "i" };
    }

    if (price.trim()) {
      const maxPrice = Number.parseInt(price, 10);
      if (!Number.isNaN(maxPrice)) {
        query.price = { $lte: maxPrice };
      }
    }

    const pgs = await Pg.find(query)
      .sort({ createdAt: -1 })
      .populate("ownerId", "username name email phone")
      .lean();
    const reviewStatsByPgId = await buildReviewStatsMap(pgs.map((pg) => pg._id));

    const pgsWithStats = pgs.map((pg) => {
      const reviewStats = reviewStatsByPgId.get(String(pg._id)) || {
        reviewCount: 0,
        averageRating: 0,
      };

      return {
        ...pg,
        reviewCount: reviewStats.reviewCount,
        averageRating: reviewStats.averageRating,
      };
    });

    return res.status(200).json({ pgs: pgsWithStats });
  } catch (error) {
    return next(error);
  }
};

const getPublicPgStats = async (_req, res, next) => {
  try {
    const publicFilter = await resolvePublicPgFilter();
    const approvedPgs = await Pg.find(publicFilter).select("_id city");
    const approvedPgIds = approvedPgs.map((pg) => pg._id);

    const [roleBasedResidents, bookingResidents, reviews] = await Promise.all([
      User.countDocuments({ role: "user" }),
      approvedPgIds.length ? Booking.distinct("userId", { pgId: { $in: approvedPgIds } }) : [],
      approvedPgIds.length ? Review.find({ pgId: { $in: approvedPgIds } }).select("rating") : [],
    ]);

    const validRatings = reviews
      .map((review) => Number(review.rating))
      .filter((rating) => Number.isFinite(rating) && rating > 0);

    const averageRating = validRatings.length
      ? Number((validRatings.reduce((sum, rating) => sum + rating, 0) / validRatings.length).toFixed(1))
      : null;

    return res.status(200).json({
      stats: {
        residentCount: Math.max(roleBasedResidents, bookingResidents.length),
        verifiedListingCount: approvedPgs.length,
        averageRating,
        reviewCount: reviews.length,
        citiesCovered: new Set(approvedPgs.map((pg) => pg.city).filter(Boolean)).size,
      },
    });
  } catch (error) {
    return next(error);
  }
};

const reverseGeocode = async (req, res, next) => {
  try {
    const lat = Number(req.query.lat);
    const lon = Number(req.query.lon);

    if (!Number.isFinite(lat) || !Number.isFinite(lon)) {
      return res.status(400).json({ message: "Valid latitude and longitude are required" });
    }

    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${encodeURIComponent(lat)}&lon=${encodeURIComponent(lon)}`,
      {
        headers: {
          Accept: "application/json",
          "User-Agent": "StayFinder/1.0",
        },
      }
    );

    if (!response.ok) {
      return res.status(502).json({ message: "Unable to resolve the current location right now" });
    }

    const data = await response.json();
    const city =
      data?.address?.city ||
      data?.address?.town ||
      data?.address?.state_district ||
      data?.address?.county ||
      data?.address?.state ||
      "";

    if (!city) {
      return res.status(404).json({ message: "We could not detect your city from the current location" });
    }

    return res.status(200).json({ city, address: data?.display_name || "" });
  } catch (error) {
    return next(error);
  }
};

const getPgById = async (req, res, next) => {
  try {
    const publicFilter = await resolvePublicPgFilter();
    const pg = await Pg.findOne({ _id: req.params.id, ...publicFilter }).populate("ownerId", "username name email phone");

    if (!pg) {
      return res.status(404).json({ message: "PG not found" });
    }

    const reviewDocs = await Review.find({ pgId: pg._id }).sort({ createdAt: -1 });
    const payload = pg.toObject();
    payload.reviews = reviewDocs.map((item) => ({
      _id: item._id,
      name: item.name,
      rating: item.rating,
      comment: item.comment,
    }));

    return res.status(200).json({ pg: payload });
  } catch (error) {
    if (error.name === "CastError") {
      return res.status(404).json({ message: "PG not found" });
    }
    return next(error);
  }
};

const addReview = async (req, res, next) => {
  try {
    const { pgId, rating, comment } = req.body;
    await Review.create({
      pgId,
      userId: req.user._id,
      name: req.user.username || req.user.name,
      rating: Number(rating),
      comment,
    });

    const allReviews = await Review.find({ pgId }).sort({ createdAt: -1 });

    return res.status(201).json({ message: "Review added", reviews: allReviews });
  } catch (error) {
    return next(error);
  }
};

const getAdminDashboard = async (req, res, next) => {
  try {
    const [totalUsers, totalMessages, pendingPgs, approvedPgs, recentPendingPgs, recentMessages] = await Promise.all([
      User.countDocuments({ role: { $ne: "admin" } }),
      Contact.countDocuments(),
      Pg.countDocuments({ isApproved: false }),
      Pg.countDocuments({ isApproved: true }),
      Pg.find({ isApproved: false }).sort({ createdAt: -1 }).limit(5).populate("ownerId", "username name"),
      Contact.find().sort({ createdAt: -1 }).limit(5),
    ]);

    return res.status(200).json({
      stats: { totalUsers, totalMessages, pendingPgs, approvedPgs },
      recentPendingPgs,
      recentMessages,
    });
  } catch (error) {
    return next(error);
  }
};

const getPendingPgs = async (req, res, next) => {
  try {
    const pgs = await Pg.find({ isApproved: false }).populate("ownerId", "username name email phone");

    return res.status(200).json({ pgs });
  } catch (error) {
    return next(error);
  }
};

const approvePg = async (req, res, next) => {
  try {
    await Pg.findByIdAndUpdate(req.params.id, { isApproved: true });

    return res.status(200).json({ message: "PG Approved successfully" });
  } catch (error) {
    return next(error);
  }
};

const getOwnerDashboard = async (req, res, next) => {
  try {
    const ownerId = req.user._id;
    const [pgs, bookings] = await Promise.all([
      Pg.find({ ownerId }),
      Booking.find().populate({
        path: "pgId",
        match: { ownerId },
      }).populate("userId", "username email phone"),
    ]);

    const ownerBookings = bookings.filter((booking) => booking.pgId !== null);

    return res.status(200).json({
      stats: {
        totalPgs: pgs.length,
        totalBookings: ownerBookings.length,
        totalAvailableRooms: pgs.reduce((sum, pg) => sum + pg.availableRooms, 0),
        pendingPgs: pgs.filter((pg) => !pg.isApproved).length,
        approvedPgs: pgs.filter((pg) => pg.isApproved).length,
      },
      recentPgs: pgs.slice(0, 5),
      recentBookings: ownerBookings.slice(0, 5).map((booking) => ({
        ...booking.toObject(),
        user: booking.userId,
        pg: booking.pgId,
      })),
    });
  } catch (error) {
    return next(error);
  }
};

module.exports = {
  listAllPgs,
  getPublicPgStats,
  reverseGeocode,
  getPgById,
  addReview,
  getAdminDashboard,
  getPendingPgs,
  approvePg,
  getOwnerDashboard,
};

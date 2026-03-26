const Pg = require("../models/pg-model");
const Booking = require("../models/booking-model");
const Review = require("../models/review-model");
const User = require("../models/user-models");
const Contact = require("../models/contact-model");

const resolvePublicPgFilter = async () => {
  return {}; // DEV: Show all PGs to fix empty collections immediately
};

const listAllPgs = async (req, res, next) => {
  try {
    const { city = "", price = "", gender = "" } = req.query;
    const query = await resolvePublicPgFilter();

    if (city.trim()) {
      query.$or = [
        { city: { $regex: city.trim(), $options: "i" } },
        { area: { $regex: city.trim(), $options: "i" } },
        { address: { $regex: city.trim(), $options: "i" } },
      ];
    }

    if (gender.trim()) {
      // Use regex for flexible matching (male/Male/Boys etc)
      query.gender = { $regex: `^${gender.trim()}`, $options: "i" };
    }

    if (price.trim()) {
      const maxPrice = Number.parseInt(price, 10);
      if (!Number.isNaN(maxPrice)) {
        query.price = { $lte: maxPrice };
      }
    }

    // Lean allows us to add properties to the object before sending
    const pgs = await Pg.find(query).sort({ createdAt: -1 }).populate("ownerId", "username name email phone").lean();

    // Attach review stats to each PG so the frontend can display stars
    const pgsWithStats = await Promise.all(
      pgs.map(async (pg) => {
        const reviews = await Review.find({ pgId: pg._id }).select("rating");
        const reviewCount = reviews.length;
        const averageRating = reviewCount
          ? Number((reviews.reduce((sum, r) => sum + r.rating, 0) / reviewCount).toFixed(1))
          : 0;
        
        return {
          ...pg,
          reviewCount,
          averageRating,
          reviews: reviews, // Keep for frontend normalization
        };
      })
    );

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
    const publicFilter = {}; // DEV: Match listAllPgs
    const pg = await Pg.findOne({ _id: req.params.id, ...publicFilter }).populate("ownerId", "username name email phone");
    if (!pg) {
      return res.status(404).json({ message: "PG not found" });
    }

    const reviewDocs = await Review.find({ pgId: pg._id }).sort({ createdAt: -1 });
    const payload = pg.toObject();
    if (reviewDocs.length > 0) {
      payload.reviews = reviewDocs.map((item) => ({
        _id: item._id,
        name: item.name,
        rating: item.rating,
        comment: item.comment,
      }));
    }

    return res.status(200).json({ pg: payload });
  } catch (error) {
    if (error.name === "CastError") {
      return res.status(404).json({ message: "PG not found" });
    }
    return next(error);
  }
};

// --- REVIEW LOGIC ---
const addReview = async (req, res, next) => {
  try {
    const { pgId, rating, comment } = req.body;
    const newReview = await Review.create({
      pgId,
      userId: req.user._id,
      name: req.user.username || req.user.name,
      rating: Number(rating),
      comment
    });

    const allReviews = await Review.find({ pgId }).sort({ createdAt: -1 });
    return res.status(201).json({ message: "Review added", reviews: allReviews });
  } catch (error) {
    next(error);
  }
};

// --- ADMIN LOGIC ---
const getAdminDashboard = async (req, res, next) => {
  try {
    const [totalUsers, totalMessages, pendingPgs, approvedPgs, recentPendingPgs, recentMessages] = await Promise.all([
      User.countDocuments({ role: { $ne: "admin" } }),
      Contact.countDocuments(),
      Pg.countDocuments({ isApproved: false }),
      Pg.countDocuments({ isApproved: true }),
      Pg.find({ isApproved: false }).sort({ createdAt: -1 }).limit(5).populate("ownerId", "username name"),
      Contact.find().sort({ createdAt: -1 }).limit(5)
    ]);

    res.status(200).json({
      stats: { totalUsers, totalMessages, pendingPgs, approvedPgs },
      recentPendingPgs,
      recentMessages
    });
  } catch (error) {
    next(error);
  }
};

const getPendingPgs = async (req, res, next) => {
  try {
    const pgs = await Pg.find({ isApproved: false }).populate("ownerId", "username name email phone");
    res.status(200).json({ pgs });
  } catch (error) {
    next(error);
  }
};

const approvePg = async (req, res, next) => {
  try {
    await Pg.findByIdAndUpdate(req.params.id, { isApproved: true });
    res.status(200).json({ message: "PG Approved successfully" });
  } catch (error) {
    next(error);
  }
};

// --- OWNER LOGIC ---
const getOwnerDashboard = async (req, res, next) => {
  try {
    const ownerId = req.user._id;
    const [pgs, bookings] = await Promise.all([
      Pg.find({ ownerId }),
      Booking.find().populate({
        path: 'pgId',
        match: { ownerId }
      }).populate("userId", "username email phone")
    ]);

    const ownerBookings = bookings.filter(b => b.pgId !== null);

    res.status(200).json({
      stats: {
        totalPgs: pgs.length,
        totalBookings: ownerBookings.length,
        totalAvailableRooms: pgs.reduce((sum, p) => sum + p.availableRooms, 0),
        pendingPgs: pgs.filter(p => !p.isApproved).length,
        approvedPgs: pgs.filter(p => p.isApproved).length
      },
      recentPgs: pgs.slice(0, 5),
      recentBookings: ownerBookings.slice(0, 5).map(b => ({
        ...b.toObject(),
        user: b.userId,
        pg: b.pgId
      }))
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { 
  listAllPgs, getPublicPgStats, reverseGeocode, getPgById, 
  addReview, getAdminDashboard, getPendingPgs, approvePg, getOwnerDashboard 
};

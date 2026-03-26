const Booking = require("../models/booking-model");
const Pg = require("../models/pg-model");
const Review = require("../models/review-model");
const Wishlist = require("../models/wishlist-model");

const normalizeGender = (value) => {
  const normalized = String(value || "").trim().toLowerCase();

  if (["boys", "male"].includes(normalized)) return "male";
  if (["girls", "female"].includes(normalized)) return "female";
  return "unisex";
};

const normalizeRoomType = (value) => {
  const normalized = String(value || "").trim().toLowerCase();

  if (!normalized) return "";
  if (["single", "single room", "private"].includes(normalized)) return "single";
  if (["double", "double sharing", "twin"].includes(normalized)) return "double";
  if (["shared", "triple sharing", "quad sharing", "dormitory"].includes(normalized)) {
    return "shared";
  }

  return normalized;
};

const cleanStringArray = (value) => (
  Array.isArray(value)
    ? value.map((item) => String(item || "").trim()).filter(Boolean)
    : []
);

const buildPgPayload = (body, ownerId) => {
  const images = cleanStringArray(body.images);
  const derivedArea = body.area?.trim() || body.location?.trim() || body.address?.trim() || "";
  const derivedAddress = body.address?.trim() || body.location?.trim() || [derivedArea, body.city?.trim()].filter(Boolean).join(", ");
  const totalRooms = Number(body.totalRooms ?? body.availableRooms ?? 0);
  const availableRooms = Number(body.availableRooms ?? 0);

  return {
    ownerId,
    title: body.title.trim(),
    description: body.description?.trim() ?? "",
    city: body.city.trim(),
    area: derivedArea,
    address: derivedAddress,
    price: Number(body.price),
    gender: normalizeGender(body.gender),
    roomType: normalizeRoomType(body.roomType),
    totalRooms: Math.max(totalRooms, availableRooms),
    availableRooms,
    amenities: cleanStringArray(body.amenities),
    images,
    isApproved: false,
  };
};

const getOwnerDashboard = async (req, res, next) => {
  try {
    const ownerId = req.userId;

    const [pgs, bookings] = await Promise.all([
      Pg.find({ ownerId }).sort({ createdAt: -1 }),
      Booking.find()
        .populate({
          path: "pgId",
          match: { ownerId },
          select: "title city area address price availableRooms",
        })
        .populate("userId", "name email phone role isAdmin")
        .sort({ createdAt: -1 }),
    ]);

    const filteredBookings = bookings.filter((booking) => booking.pg);
    const totalRooms = pgs.reduce((sum, pg) => sum + (pg.availableRooms ?? 0), 0);

    return res.status(200).json({
      stats: {
        totalPgs: pgs.length,
        totalBookings: filteredBookings.length,
        totalAvailableRooms: totalRooms,
        pendingPgs: pgs.filter((pg) => !pg.isApproved).length,
        approvedPgs: pgs.filter((pg) => pg.isApproved).length,
      },
      recentPgs: pgs.slice(0, 4),
      recentBookings: filteredBookings.slice(0, 6),
    });
  } catch (error) {
    return next(error);
  }
};

const getOwnerPgs = async (req, res, next) => {
  try {
    const pgs = await Pg.find({ ownerId: req.userId }).sort({ createdAt: -1 });
    return res.status(200).json({ pgs });
  } catch (error) {
    return next(error);
  }
};

const createOwnerPg = async (req, res, next) => {
  try {
    if (!["owner", "admin"].includes(req.userRole)) {
      return res.status(403).json({ message: "Only owners or admins can create listings" });
    }

    const pg = await Pg.create(buildPgPayload(req.body, req.userId));
    return res.status(201).json({
      message: "PG submitted successfully and is waiting for admin approval",
      pg,
    });
  } catch (error) {
    return next(error);
  }
};

const updateOwnerPg = async (req, res, next) => {
  try {
    if (!["owner", "admin"].includes(req.userRole)) {
      return res.status(403).json({ message: "Only owners or admins can update listings" });
    }

    const pg = await Pg.findOne({ _id: req.params.id, ownerId: req.userId });
    if (!pg) {
      return res.status(404).json({ message: "PG not found" });
    }

    Object.assign(pg, buildPgPayload(req.body, req.userId));
    await pg.save();

    return res.status(200).json({
      message: "PG updated successfully and sent back for admin approval",
      pg,
    });
  } catch (error) {
    if (error.name === "CastError") {
      return res.status(404).json({ message: "PG not found" });
    }
    return next(error);
  }
};

const deleteOwnerPg = async (req, res, next) => {
  try {
    if (!["owner", "admin"].includes(req.userRole)) {
      return res.status(403).json({ message: "Only owners or admins can delete listings" });
    }

    const pg = await Pg.findOneAndDelete({ _id: req.params.id, ownerId: req.userId });
    if (!pg) {
      return res.status(404).json({ message: "PG not found" });
    }

    await Booking.deleteMany({ pgId: pg._id });
    await Wishlist.deleteMany({ pgId: pg._id });
    await Review.deleteMany({ pgId: pg._id });

    return res.status(200).json({ message: "PG deleted successfully" });
  } catch (error) {
    if (error.name === "CastError") {
      return res.status(404).json({ message: "PG not found" });
    }
    return next(error);
  }
};

const getOwnerBookings = async (req, res, next) => {
  try {
    const bookings = await Booking.find()
      .populate({
        path: "pgId",
        match: { ownerId: req.userId },
        select: "title city area address price",
      })
      .populate("userId", "name email phone role isAdmin")
      .sort({ createdAt: -1 });

    return res.status(200).json({
      bookings: bookings.filter((booking) => booking.pg),
    });
  } catch (error) {
    return next(error);
  }
};

module.exports = {
  getOwnerDashboard,
  getOwnerPgs,
  createOwnerPg,
  updateOwnerPg,
  deleteOwnerPg,
  getOwnerBookings,
};

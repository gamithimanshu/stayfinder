const mongoose = require("mongoose");

const normalizeGender = (value) => {
  const normalized = String(value || "").trim().toLowerCase();

  if (["boys", "male"].includes(normalized)) return "male";
  if (["girls", "female"].includes(normalized)) return "female";
  if (["co-ed", "coed", "unisex", "mixed"].includes(normalized)) return "unisex";
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

const reviewSchema = new mongoose.Schema(
  {
    name: { type: String, trim: true, required: true },
    rating: { type: Number, min: 1, max: 5, required: true },
    comment: { type: String, trim: true, required: true },
  },
  { _id: false }
);

const pgSchema = new mongoose.Schema(
  {
    ownerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
      index: true,
    },
    title: { type: String, required: true, trim: true },
    description: { type: String, default: "" },
    city: { type: String, required: true, trim: true },
    area: { type: String, default: "", trim: true },
    address: { type: String, default: "", trim: true },
    price: { type: Number, required: true, min: 0 },
    gender: {
      type: String,
      enum: ["male", "female", "unisex"],
      default: "unisex",
      trim: true,
      set: normalizeGender,
    },
    roomType: {
      type: String,
      enum: ["", "single", "double", "shared"],
      default: "",
      trim: true,
      set: normalizeRoomType,
    },
    totalRooms: { type: Number, default: 0, min: 0 },
    images: { type: [String], default: [] },
    amenities: { type: [String], default: [] },
    availableRooms: { type: Number, default: 0, min: 0 },
    isApproved: {
      type: Boolean,
      default: false,
      index: true,
    },
    reviews: { type: [reviewSchema], default: [] },
  },
  {
    timestamps: true,
    collection: "pgs",
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

pgSchema.virtual("owner")
  .get(function getOwner() {
    return this.ownerId;
  })
  .set(function setOwner(value) {
    this.ownerId = value;
  });

pgSchema.virtual("approved")
  .get(function getApproved() {
    return this.isApproved;
  })
  .set(function setApproved(value) {
    this.isApproved = value;
  });

pgSchema.virtual("location")
  .get(function getLocation() {
    return this.address || [this.area, this.city].filter(Boolean).join(", ");
  })
  .set(function setLocation(value) {
    const normalized = (value || "").trim();
    this.address = normalized;
    if (!this.area) {
      this.area = normalized;
    }
  });

pgSchema.virtual("image").get(function getImage() {
  return this.images?.[0] || "";
});

pgSchema.virtual("averageRating").get(function getAverageRating() {
  const ratings = this.reviews.map(r => Number(r.rating)).filter(r => r > 0 && Number.isFinite(r));
  return ratings.length ? Number((ratings.reduce((a, b) => a + b, 0) / ratings.length).toFixed(1)) : null;
});

pgSchema.virtual("reviewCount").get(function getReviewCount() {
  return this.reviews.length;
});

module.exports = mongoose.models.PG || mongoose.model("PG", pgSchema);

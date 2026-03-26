const mongoose = require("mongoose");

const wishlistSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    pgId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "PG",
      required: true,
      index: true,
    },
  },
  {
    timestamps: true,
    collection: "wishlists",
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

wishlistSchema.virtual("user")
  .get(function getUser() {
    return this.userId;
  })
  .set(function setUser(value) {
    this.userId = value;
  });

wishlistSchema.virtual("pg")
  .get(function getPg() {
    return this.pgId;
  })
  .set(function setPg(value) {
    this.pgId = value;
  });

wishlistSchema.index({ userId: 1, pgId: 1 }, { unique: true });

module.exports = mongoose.models.Wishlist || mongoose.model("Wishlist", wishlistSchema);

const mongoose = require("mongoose");
const Review = require("../models/review-model");
const User = require("../models/user-models");
const Wishlist = require("../models/wishlist-model");

const isMissingNamespaceError = (error) => {
  const message = error?.message || "";
  return message.includes("ns does not exist") || error?.codeName === "NamespaceNotFound";
};

const readIndexesSafely = async (collectionName) => {
  try {
    return await mongoose.connection.collection(collectionName).indexes();
  } catch (error) {
    if (isMissingNamespaceError(error)) {
      return [];
    }

    throw error;
  }
};

const dropIndexSafely = async (collectionName, indexName) => {
  try {
    await mongoose.connection.collection(collectionName).dropIndex(indexName);
    console.log(`dropped legacy index from ${collectionName}: ${indexName}`);
  } catch (error) {
    if (isMissingNamespaceError(error)) {
      return;
    }

    throw error;
  }
};

const syncDatabaseIndexes = async () => {
  const indexes = await readIndexesSafely("wishlists");
  const reviewIndexes = await readIndexesSafely("reviews");
  const legacyIndexNames = ["user_1_listing_1", "user_1_pg_1"];
  const legacyReviewIndexNames = ["listing_1_user_1", "user_1_listing_1"];

  for (const indexName of legacyIndexNames) {
    const hasLegacyIndex = indexes.some((index) => index.name === indexName);
    if (hasLegacyIndex) {
      await dropIndexSafely("wishlists", indexName);
    }
  }

  for (const indexName of legacyReviewIndexNames) {
    const hasLegacyIndex = reviewIndexes.some((index) => index.name === indexName);
    if (hasLegacyIndex) {
      await dropIndexSafely("reviews", indexName);
    }
  }

  await Wishlist.syncIndexes();
  await Review.syncIndexes();
  await User.syncLegacyAdminRoles();
};

const resolveMongoCandidates = () => {
  const target = (process.env.DB_TARGET || "local").toLowerCase();
  const localUri = process.env.LOCAL_DB_URI;
  const cloudUri = process.env.MONGO_URI;

  if (process.env.DB_URI) {
    return [{ uri: process.env.DB_URI, source: "DB_URI" }];
  }

  if (target === "cloud") {
    return [
      { uri: cloudUri, source: "MONGO_URI" },
      { uri: localUri, source: "LOCAL_DB_URI" },
    ].filter((item) => Boolean(item.uri));
  }

  return [
    { uri: localUri, source: "LOCAL_DB_URI" },
    { uri: cloudUri, source: "MONGO_URI" },
  ].filter((item) => Boolean(item.uri));
};

const connectDb = async () => {
  const candidates = resolveMongoCandidates();

  if (!candidates.length) {
    throw new Error("No MongoDB URI found. Set DB_URI or LOCAL_DB_URI/MONGO_URI");
  }

  const failures = [];
  for (const { uri, source } of candidates) {
    try {
      await mongoose.connect(uri, { serverSelectionTimeoutMS: 7000 });
      // Index sync can fail due to permissions/schema differences.
      // We don't want that to block the app from working at all.
      try {
        await syncDatabaseIndexes();
      } catch (syncError) {
        console.warn(
          `MongoDB connected to ${source}, but syncDatabaseIndexes failed (continuing):`,
          syncError?.message || syncError
        );
      }
      console.log(`connection successful to DB (${source}) -> ${mongoose.connection.name}`);
      return;
    } catch (error) {
      failures.push(`${source}: ${error.message}`);
    }
  }

  throw new Error(`Database connection failed. Attempts -> ${failures.join(" | ")}`);
};

module.exports = connectDb;

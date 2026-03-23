const mongoose = require("mongoose");

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
      console.log(`connection successful to DB (${source}) -> ${mongoose.connection.name}`);
      return;
    } catch (error) {
      failures.push(`${source}: ${error.message}`);
    }
  }

  throw new Error(`Database connection failed. Attempts -> ${failures.join(" | ")}`);
};

module.exports = connectDb;

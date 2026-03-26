const { z } = require("zod");

const wishlistSchema = z.object({
  pgId: z.string().trim().min(1, "PG id is required"),
});

module.exports = { wishlistSchema };

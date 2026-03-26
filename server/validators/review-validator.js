const { z } = require("zod");

const reviewSchema = z.object({
  pgId: z.string().trim().min(1, "PG id is required"),
  rating: z.coerce.number().min(1).max(5),
  comment: z.string().trim().min(3).max(1000),
});

module.exports = { reviewSchema };

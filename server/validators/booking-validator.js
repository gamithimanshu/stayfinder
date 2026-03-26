const { z } = require("zod");

const bookingSchema = z.object({
  pgId: z.string().trim().min(1, "PG id is required"),
  checkInDate: z.coerce.date(),
  durationMonths: z.coerce.number().int().min(1).max(24),
  paymentMethod: z.string().trim().min(1).max(50).optional(),
});

module.exports = { bookingSchema };

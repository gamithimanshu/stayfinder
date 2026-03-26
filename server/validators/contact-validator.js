const { z } = require("zod");

const contactSchema = z.object({
  name: z.string().trim().min(3).max(100),
  email: z.string().trim().email().max(255),
  subject: z.string().trim().max(255).optional(),
  message: z.string().trim().min(10).max(2000),
});

module.exports = { contactSchema };

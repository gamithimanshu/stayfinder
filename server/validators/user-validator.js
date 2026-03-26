const { z } = require("zod");

const updateProfileSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(3, { message: "Name must be at least 3 characters" })
      .max(255, { message: "Name must not be more than 255 characters" })
      .optional(),
    username: z
      .string()
      .trim()
      .min(3, { message: "Name must be at least 3 characters" })
      .max(255, { message: "Name must not be more than 255 characters" }),
    email: z
      .string({ required_error: "Email is required" })
      .trim()
      .email({ message: "Invalid email address" })
      .max(255, { message: "Email must not be more than 255 characters" }),
    phone: z
      .string({ required_error: "Phone is required" })
      .trim()
      .min(10, { message: "Phone must be at least 10 characters" })
      .max(20, { message: "Phone must not be more than 20 characters" }),
    currentPassword: z.string().trim().optional().or(z.literal("")),
    newPassword: z
      .string()
      .trim()
      .min(7, { message: "New password must be at least 7 characters" })
      .max(1024, { message: "Password can't be greater than 1024 characters" })
      .optional()
      .or(z.literal("")),
  })
  .refine((data) => Boolean(data.name || data.username), {
    message: "Name is required",
    path: ["name"],
  })
  .superRefine((data, ctx) => {
    if (data.newPassword && !data.currentPassword) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["currentPassword"],
        message: "Current password is required to set a new password",
      });
    }
  });

module.exports = { updateProfileSchema };

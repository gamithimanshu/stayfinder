const { z } = require("zod");

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

const normalizeGender = (value) => {
  const normalized = String(value || "").trim().toLowerCase();

  if (["male", "boys"].includes(normalized)) return "male";
  if (["female", "girls"].includes(normalized)) return "female";
  if (["unisex", "co-ed", "coed", "mixed"].includes(normalized)) return "unisex";
  return normalized;
};

const ownerPgSchema = z.object({
  title: z.string().trim().min(3).max(255),
  price: z.coerce.number().min(0),
  location: z.string().trim().min(3).max(255).optional(),
  city: z.string().trim().min(2).max(100),
  area: z.string().trim().max(255).optional(),
  address: z.string().trim().min(3).max(255),
  gender: z
    .string()
    .trim()
    .transform(normalizeGender)
    .refine((value) => ["male", "female", "unisex"].includes(value), {
      message: "Gender must be male, female, or unisex",
    }),
  roomType: z
    .string()
    .trim()
    .optional()
    .transform((value) => normalizeRoomType(value))
    .refine((value) => !value || ["single", "double", "shared"].includes(value), {
      message: "Room type must be single, double, or shared",
    }),
  totalRooms: z.coerce.number().int().min(1).optional(),
  images: z.array(z.string().trim().min(1)).min(1, "At least one image is required"),
  amenities: z.array(z.string().trim()).default([]),
  description: z.string().trim().max(2000).default(""),
  availableRooms: z.coerce.number().int().min(0),
}).refine((data) => {
  const totalRooms = Number(data.totalRooms ?? data.availableRooms ?? 0);
  return Number(data.availableRooms) <= totalRooms;
}, {
  message: "Available rooms cannot exceed total rooms",
  path: ["availableRooms"],
});

module.exports = { ownerPgSchema };

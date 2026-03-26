require("../utils/load-env");
const mongoose = require("mongoose");
const connectDb = require("../utils/db");

const Pg = require("../models/pg-model");
const Booking = require("../models/booking-model");
const Payment = require("../models/payment-model");
const Wishlist = require("../models/wishlist-model");
const Review = require("../models/review-model");

const demoPgs = [
  {
    title: "StayFinder Prime Residency",
    description:
      "Bright rooms, weekly housekeeping, and a calm neighborhood. Ideal for working professionals who want a quiet, clean stay with reliable Wi‑Fi.",
    city: "Ahmedabad",
    area: "Prahlad Nagar",
    address: "Prahlad Nagar, Ahmedabad",
    price: 9500,
    gender: "unisex",
    roomType: "single",
    totalRooms: 24,
    availableRooms: 6,
    amenities: ["Wi‑Fi", "Housekeeping", "Laundry", "RO Water", "CCTV", "Power Backup"],
    images: [
      "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=1400&q=80",
      "https://images.unsplash.com/photo-1505693314120-0d443867891c?auto=format&fit=crop&w=1400&q=80",
      "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?auto=format&fit=crop&w=1400&q=80",
    ],
    isApproved: true,
  },
  {
    title: "Skyline Boys PG",
    description:
      "Budget-friendly boys PG near key coaching hubs. Great connectivity, quick meals, and comfortable shared rooms.",
    city: "Surat",
    area: "Adajan",
    address: "Adajan, Surat",
    price: 6800,
    gender: "male",
    roomType: "shared",
    totalRooms: 30,
    availableRooms: 9,
    amenities: ["Meals", "Wi‑Fi", "CCTV", "Study Area", "Hot Water"],
    images: [
      "https://images.unsplash.com/photo-1502005229762-cf1b2da7c5d6?auto=format&fit=crop&w=1400&q=80",
      "https://images.unsplash.com/photo-1484154218962-a197022b5858?auto=format&fit=crop&w=1400&q=80",
    ],
    isApproved: true,
  },
  {
    title: "Heritage Girls Hostel",
    description:
      "Secure girls hostel with warden support, visitor policies, and a friendly community. Walking distance to markets and transport.",
    city: "Vadodara",
    area: "Alkapuri",
    address: "Alkapuri, Vadodara",
    price: 8200,
    gender: "female",
    roomType: "double",
    totalRooms: 18,
    availableRooms: 4,
    amenities: ["CCTV", "Warden", "Meals", "Wi‑Fi", "Power Backup"],
    images: [
      "https://images.unsplash.com/photo-1505691938895-1758d7feb511?auto=format&fit=crop&w=1400&q=80",
      "https://images.unsplash.com/photo-1493809842364-78817add7ffb?auto=format&fit=crop&w=1400&q=80",
    ],
    isApproved: true,
  },
  {
    title: "Metro Co-Living Stay",
    description:
      "Modern co-living with shared lounge, high-speed Wi‑Fi and flexible monthly stays. Best for interns and new joiners.",
    city: "Gandhinagar",
    area: "Infocity",
    address: "Infocity, Gandhinagar",
    price: 11000,
    gender: "unisex",
    roomType: "single",
    totalRooms: 20,
    availableRooms: 5,
    amenities: ["Wi‑Fi", "Gym", "Common Lounge", "Laundry", "CCTV", "RO Water"],
    images: [
      "https://images.unsplash.com/photo-1554995207-c18c203602cb?auto=format&fit=crop&w=1400&q=80",
      "https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=1400&q=80",
    ],
    isApproved: true,
  },
  {
    title: "GreenNest PG & Hostel",
    description:
      "Peaceful stay with greenery, clean washrooms, and meal options. Suitable for students and working professionals.",
    city: "Rajkot",
    area: "Kalavad Road",
    address: "Kalavad Road, Rajkot",
    price: 7400,
    gender: "unisex",
    roomType: "shared",
    totalRooms: 26,
    availableRooms: 8,
    amenities: ["Meals", "Wi‑Fi", "Parking", "CCTV", "Housekeeping"],
    images: [
      "https://images.unsplash.com/photo-1512918728675-ed5a9ecdebfd?auto=format&fit=crop&w=1400&q=80",
      "https://images.unsplash.com/photo-1501045661006-fcebe0257c3f?auto=format&fit=crop&w=1400&q=80",
    ],
    isApproved: true,
  },
  {
    title: "No-Image Demo PG",
    description:
      "This is a demo listing without uploaded images. The website should automatically show the public fallback image.",
    city: "Vyara",
    area: "Main Road",
    address: "Main Road, Vyara",
    price: 6000,
    gender: "unisex",
    roomType: "double",
    totalRooms: 10,
    availableRooms: 2,
    amenities: ["Wi‑Fi", "RO Water"],
    images: [],
    isApproved: true,
  },
];

async function run() {
  await connectDb();

  console.log("Deleting dependent collections (bookings/payments/wishlists/reviews) and PGs...");
  await Promise.all([
    Payment.deleteMany({}),
    Booking.deleteMany({}),
    Wishlist.deleteMany({}),
    Review.deleteMany({}),
  ]);
  await Pg.deleteMany({});

  console.log("Inserting demo PG listings...");
  const inserted = await Pg.insertMany(
    demoPgs.map((pg) => ({
      ...pg,
      ownerId: null,
      reviews: [],
    }))
  );

  console.log(`Seed complete. Inserted PGs: ${inserted.length}`);
  await mongoose.disconnect();
}

run().catch(async (error) => {
  console.error("Seed failed:", error);
  try {
    await mongoose.disconnect();
  } catch {
    // ignore
  }
  process.exit(1);
});


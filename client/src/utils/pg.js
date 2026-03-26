const toArray = (value) => (Array.isArray(value) ? value.filter(Boolean) : []);

export function extractCity(location = "") {
  const parts = String(location ?? "").split(",").map((part) => part.trim()).filter(Boolean);
  return parts.at(-1) ?? "";
}

export function getReviewStats(reviews = []) {
  if (!Array.isArray(reviews) || reviews.length === 0) {
    return {
      averageRating: null,
      reviewCount: 0,
    };
  }

  const validRatings = reviews
    .map((review) => Number(review?.rating))
    .filter((rating) => Number.isFinite(rating) && rating > 0);

  if (validRatings.length === 0) {
    return {
      averageRating: null,
      reviewCount: reviews.length,
    };
  }

  const total = validRatings.reduce((sum, rating) => sum + rating, 0);

  return {
    averageRating: Number((total / validRatings.length).toFixed(1)),
    reviewCount: reviews.length,
  };
}

export const FALLBACK_PG_IMAGE = "/fallback-pg.svg";

export function normalizeListing(listing = {}) {
  const title = listing.title ?? listing.name ?? "Untitled PG";
  const images = toArray(listing.images).length > 0
    ? toArray(listing.images)
    : [listing.image ?? listing.imageUrl ?? listing.thumbnail ?? ""].filter(Boolean);
  const location =
    listing.location ||
    listing.address ||
    [listing.area, listing.city].filter(Boolean).join(", ") ||
    "";
  const reviews = toArray(listing.reviews);
  const { averageRating, reviewCount } = getReviewStats(reviews);
  const primaryImage = listing.image ?? listing.imageUrl ?? listing.thumbnail ?? images[0] ?? "";
  const safeImage = primaryImage || FALLBACK_PG_IMAGE;
  const safeImages = images.length ? images : [safeImage];
  const amenities = Array.isArray(listing.amenities)
    ? listing.amenities.map((item) => String(item ?? "").trim()).filter(Boolean)
    : typeof listing.amenities === "string"
      ? listing.amenities.split(",").map((item) => item.trim()).filter(Boolean)
      : [];

  return {
    id: listing.id ?? listing._id ?? "",
    title,
    price: Number(listing.price ?? listing.rent ?? listing.monthlyRent ?? 0),
    location,
    city: listing.city ?? extractCity(location) ?? "",
    gender: String(listing.gender ?? listing.category ?? "unisex").toLowerCase(),
    image: safeImage,
    images: safeImages,
    amenities,
    description: listing.description ?? listing.details ?? "",
    roomType: listing.roomType ?? "",
    totalRooms: Number(listing.totalRooms ?? 0),
    availableRooms: Number(listing.availableRooms ?? 0),
    reviews,
    averageRating,
    reviewCount,
  };
}

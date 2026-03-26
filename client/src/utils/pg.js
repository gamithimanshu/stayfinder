export function extractCity(location = "") {
  const parts = location.split(",").map((part) => part.trim()).filter(Boolean);
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

export function normalizeListing(listing = {}) {
  const title = listing.title ?? listing.name ?? "Untitled PG";
  const images = Array.isArray(listing.images) && listing.images.length > 0
    ? listing.images.filter(Boolean)
    : [listing.image ?? listing.imageUrl ?? listing.thumbnail ?? ""].filter(Boolean);
  const location =
    listing.location ||
    listing.address ||
    [listing.area, listing.city].filter(Boolean).join(", ") ||
    "";
  const reviews = Array.isArray(listing.reviews) && listing.reviews.length > 0
    ? listing.reviews
    : [];
  const { averageRating, reviewCount } = getReviewStats(reviews);

  return {
    id: listing.id ?? listing._id ?? "",
    title,
    price: Number(listing.price ?? listing.rent ?? listing.monthlyRent ?? 0),
    location,
    city: listing.city ?? extractCity(location) ?? "",
    gender: (listing.gender ?? listing.category ?? "unisex").toLowerCase(),
    image: listing.image ?? listing.imageUrl ?? listing.thumbnail ?? images[0] ?? "",
    images,
    amenities: Array.isArray(listing.amenities) && listing.amenities.length > 0
      ? listing.amenities
      : [],
    description: listing.description ?? listing.details ?? "",
    roomType: listing.roomType ?? "",
    totalRooms: Number(listing.totalRooms ?? 0),
    availableRooms: Number(listing.availableRooms ?? 0),
    reviews,
    averageRating,
    reviewCount,
  };
}

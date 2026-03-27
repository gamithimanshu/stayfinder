const mongoose = require("mongoose");
const Booking = require("../models/booking-model");
const ContactMessage = require("../models/contact-model");
const Payment = require("../models/payment-model");
const Pg = require("../models/pg-model");
const User = require("../models/user-models");

const MONTH_WINDOW = 6;

const shortMonthFormatter = new Intl.DateTimeFormat("en-US", { month: "short" });

const safeNumber = (value) => {
  const number = Number(value ?? 0);
  return Number.isFinite(number) ? number : 0;
};

const toObjectId = (value) => {
  if (!value) return null;
  if (value instanceof mongoose.Types.ObjectId) return value;
  return new mongoose.Types.ObjectId(value);
};

const getMonthBuckets = (months = MONTH_WINDOW) => {
  const now = new Date();
  const currentMonthStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));

  return Array.from({ length: months }, (_, index) => {
    const date = new Date(currentMonthStart);
    date.setUTCMonth(currentMonthStart.getUTCMonth() - (months - 1 - index));

    return {
      key: `${date.getUTCFullYear()}-${date.getUTCMonth() + 1}`,
      label: shortMonthFormatter.format(date),
      year: date.getUTCFullYear(),
      month: date.getUTCMonth() + 1,
      start: date,
    };
  });
};

const getWindowStart = (months = MONTH_WINDOW) => getMonthBuckets(months)[0]?.start;

const buildPaymentScopeStages = (ownerId) => {
  const ownerObjectId = toObjectId(ownerId);
  const stages = [
    {
      $lookup: {
        from: "bookings",
        localField: "bookingId",
        foreignField: "_id",
        as: "booking",
      },
    },
    {
      $unwind: {
        path: "$booking",
        preserveNullAndEmptyArrays: false,
      },
    },
  ];

  if (!ownerObjectId) {
    return stages;
  }

  return [
    ...stages,
    {
      $lookup: {
        from: "pgs",
        localField: "booking.pgId",
        foreignField: "_id",
        as: "pg",
      },
    },
    {
      $unwind: {
        path: "$pg",
        preserveNullAndEmptyArrays: false,
      },
    },
    {
      $match: {
        "pg.ownerId": ownerObjectId,
      },
    },
  ];
};

const buildBookingScopeStages = (ownerId) => {
  const ownerObjectId = toObjectId(ownerId);
  const stages = [
    {
      $lookup: {
        from: "pgs",
        localField: "pgId",
        foreignField: "_id",
        as: "pg",
      },
    },
    {
      $unwind: {
        path: "$pg",
        preserveNullAndEmptyArrays: false,
      },
    },
  ];

  if (!ownerObjectId) {
    return stages;
  }

  return [
    ...stages,
    {
      $match: {
        "pg.ownerId": ownerObjectId,
      },
    },
  ];
};

const buildChartResponse = ({ buckets, series, rowFactory }) => ({
  labels: buckets.map((bucket) => bucket.label),
  datasets: series.map((dataset) => ({
    label: dataset.label,
    data: buckets.map((bucket) => safeNumber(dataset.valuesByKey[bucket.key])),
    color: dataset.color,
  })),
  points: buckets.map((bucket) => rowFactory(bucket)),
});

const getRevenueStatusSummary = async (ownerId) => {
  const rows = await Payment.aggregate([
    ...buildPaymentScopeStages(ownerId),
    {
      $group: {
        _id: "$paymentStatus",
        count: { $sum: 1 },
        amount: { $sum: { $ifNull: ["$amount", 0] } },
      },
    },
  ]);

  return rows.reduce(
    (accumulator, row) => {
      accumulator[String(row._id || "pending")] = {
        count: safeNumber(row.count),
        amount: safeNumber(row.amount),
      };
      return accumulator;
    },
    {
      paid: { count: 0, amount: 0 },
      pending: { count: 0, amount: 0 },
      failed: { count: 0, amount: 0 },
    }
  );
};

const getBookingStatusSummary = async (ownerId) => {
  const rows = await Booking.aggregate([
    ...buildBookingScopeStages(ownerId),
    {
      $group: {
        _id: "$bookingStatus",
        count: { $sum: 1 },
        grossAmount: { $sum: { $ifNull: ["$totalAmount", 0] } },
      },
    },
  ]);

  return rows.reduce(
    (accumulator, row) => {
      accumulator[String(row._id || "confirmed")] = {
        count: safeNumber(row.count),
        grossAmount: safeNumber(row.grossAmount),
      };
      return accumulator;
    },
    {
      pending: { count: 0, grossAmount: 0 },
      confirmed: { count: 0, grossAmount: 0 },
      cancelled: { count: 0, grossAmount: 0 },
    }
  );
};

const getMonthlyRevenueChart = async (ownerId, months = MONTH_WINDOW) => {
  const buckets = getMonthBuckets(months);
  const revenueRows = await Payment.aggregate([
    ...buildPaymentScopeStages(ownerId),
    {
      $match: {
        paymentStatus: "paid",
        "booking.bookingStatus": "confirmed",
        createdAt: { $gte: getWindowStart(months) },
      },
    },
    {
      $group: {
        _id: {
          year: { $year: "$createdAt" },
          month: { $month: "$createdAt" },
        },
        revenue: { $sum: { $ifNull: ["$amount", 0] } },
        transactions: { $sum: 1 },
      },
    },
  ]);

  const revenueByKey = {};
  const transactionsByKey = {};

  revenueRows.forEach((row) => {
    const key = `${row._id.year}-${row._id.month}`;
    revenueByKey[key] = safeNumber(row.revenue);
    transactionsByKey[key] = safeNumber(row.transactions);
  });

  return buildChartResponse({
    buckets,
    series: [
      {
        label: "Revenue",
        color: "#0f766e",
        valuesByKey: revenueByKey,
      },
    ],
    rowFactory: (bucket) => ({
      label: bucket.label,
      revenue: safeNumber(revenueByKey[bucket.key]),
      transactions: safeNumber(transactionsByKey[bucket.key]),
    }),
  });
};

const getMonthlyBookingChart = async (ownerId, months = MONTH_WINDOW) => {
  const buckets = getMonthBuckets(months);
  const bookingRows = await Booking.aggregate([
    ...buildBookingScopeStages(ownerId),
    {
      $match: {
        createdAt: { $gte: getWindowStart(months) },
      },
    },
    {
      $group: {
        _id: {
          year: { $year: "$createdAt" },
          month: { $month: "$createdAt" },
          status: "$bookingStatus",
        },
        count: { $sum: 1 },
      },
    },
  ]);

  const pendingByKey = {};
  const confirmedByKey = {};
  const cancelledByKey = {};

  bookingRows.forEach((row) => {
    const key = `${row._id.year}-${row._id.month}`;
    const count = safeNumber(row.count);

    if (row._id.status === "pending") {
      pendingByKey[key] = count;
      return;
    }

    if (row._id.status === "cancelled") {
      cancelledByKey[key] = count;
      return;
    }

    confirmedByKey[key] = count;
  });

  return buildChartResponse({
    buckets,
    series: [
      {
        label: "Pending",
        color: "#f59e0b",
        valuesByKey: pendingByKey,
      },
      {
        label: "Confirmed",
        color: "#2563eb",
        valuesByKey: confirmedByKey,
      },
      {
        label: "Cancelled",
        color: "#ef4444",
        valuesByKey: cancelledByKey,
      },
    ],
    rowFactory: (bucket) => ({
      label: bucket.label,
      pending: safeNumber(pendingByKey[bucket.key]),
      confirmed: safeNumber(confirmedByKey[bucket.key]),
      cancelled: safeNumber(cancelledByKey[bucket.key]),
    }),
  });
};

const getTopHostels = async (ownerId, limit = 5) => {
  const rows = await Booking.aggregate([
    ...buildBookingScopeStages(ownerId),
    {
      $lookup: {
        from: "payments",
        let: { bookingId: "$_id" },
        pipeline: [
          {
            $match: {
              $expr: { $eq: ["$bookingId", "$$bookingId"] },
            },
          },
          { $sort: { createdAt: -1 } },
          { $limit: 1 },
        ],
        as: "payment",
      },
    },
    {
      $unwind: {
        path: "$payment",
        preserveNullAndEmptyArrays: true,
      },
    },
    {
      $group: {
        _id: "$pg._id",
        title: { $first: "$pg.title" },
        city: { $first: "$pg.city" },
        area: { $first: "$pg.area" },
        totalRooms: { $first: { $ifNull: ["$pg.totalRooms", 0] } },
        availableRooms: { $first: { $ifNull: ["$pg.availableRooms", 0] } },
        totalBookings: { $sum: 1 },
        activeBookings: {
          $sum: {
            $cond: [{ $eq: ["$bookingStatus", "confirmed"] }, 1, 0],
          },
        },
        paidRevenue: {
          $sum: {
            $cond: [
              { $eq: ["$payment.paymentStatus", "paid"] },
              { $ifNull: ["$payment.amount", 0] },
              0,
            ],
          },
        },
        pendingRevenue: {
          $sum: {
            $cond: [
              { $eq: ["$payment.paymentStatus", "pending"] },
              { $ifNull: ["$payment.amount", 0] },
              0,
            ],
          },
        },
      },
    },
    {
      $sort: {
        paidRevenue: -1,
        activeBookings: -1,
        totalBookings: -1,
      },
    },
    {
      $limit: limit,
    },
  ]);

  return rows.map((row, index) => ({
    _id: row._id,
    rank: index + 1,
    title: row.title || "Untitled listing",
    location: [row.area, row.city].filter(Boolean).join(", ") || row.city || "Location not added",
    totalBookings: safeNumber(row.totalBookings),
    activeBookings: safeNumber(row.activeBookings),
    paidRevenue: safeNumber(row.paidRevenue),
    pendingRevenue: safeNumber(row.pendingRevenue),
    occupancy: Math.max(safeNumber(row.totalRooms) - safeNumber(row.availableRooms), 0),
  }));
};

const getRecentTransactions = async (ownerId, limit = 8) => {
  const rows = await Payment.aggregate([
    ...buildPaymentScopeStages(ownerId),
    {
      $lookup: {
        from: "users",
        localField: "booking.userId",
        foreignField: "_id",
        as: "user",
      },
    },
    {
      $unwind: {
        path: "$user",
        preserveNullAndEmptyArrays: true,
      },
    },
    {
      $addFields: {
        resolvedPg: {
          $ifNull: ["$pg", null],
        },
      },
    },
    {
      $lookup: {
        from: "pgs",
        localField: "booking.pgId",
        foreignField: "_id",
        as: "bookingPg",
      },
    },
    {
      $addFields: {
        resolvedPg: {
          $ifNull: ["$resolvedPg", { $arrayElemAt: ["$bookingPg", 0] }],
        },
      },
    },
    {
      $sort: { createdAt: -1 },
    },
    {
      $limit: limit,
    },
    {
      $project: {
        _id: 1,
        amount: { $ifNull: ["$amount", 0] },
        paymentStatus: 1,
        paymentMethod: 1,
        transactionId: 1,
        createdAt: 1,
        booking: {
          _id: "$booking._id",
          bookingStatus: "$booking.bookingStatus",
          checkInDate: "$booking.checkInDate",
        },
        user: {
          _id: "$user._id",
          name: { $ifNull: ["$user.name", "$user.username"] },
          email: "$user.email",
          phone: "$user.phone",
        },
        pg: {
          _id: "$resolvedPg._id",
          title: "$resolvedPg.title",
          city: "$resolvedPg.city",
          area: "$resolvedPg.area",
        },
      },
    },
  ]);

  return rows.map((row) => ({
    ...row,
    amount: safeNumber(row.amount),
  }));
};

const getRecentBookings = async (ownerId, limit = 6) => {
  const pipeline = [
    ...buildBookingScopeStages(ownerId),
    {
      $lookup: {
        from: "payments",
        let: { bookingId: "$_id" },
        pipeline: [
          {
            $match: {
              $expr: { $eq: ["$bookingId", "$$bookingId"] },
            },
          },
          { $sort: { createdAt: -1 } },
          { $limit: 1 },
        ],
        as: "payment",
      },
    },
    {
      $unwind: {
        path: "$payment",
        preserveNullAndEmptyArrays: true,
      },
    },
    {
      $lookup: {
        from: "users",
        localField: "userId",
        foreignField: "_id",
        as: "user",
      },
    },
    {
      $unwind: {
        path: "$user",
        preserveNullAndEmptyArrays: true,
      },
    },
    {
      $sort: { createdAt: -1 },
    },
    {
      $project: {
        _id: 1,
        totalAmount: { $ifNull: ["$totalAmount", 0] },
        bookingStatus: 1,
        checkInDate: 1,
        createdAt: 1,
        paymentStatus: {
          $ifNull: ["$payment.paymentStatus", "$paymentStatus"],
        },
        paymentMethod: "$payment.paymentMethod",
        transactionId: "$payment.transactionId",
        user: {
          _id: "$user._id",
          name: { $ifNull: ["$user.name", "$user.username"] },
          email: "$user.email",
          phone: "$user.phone",
        },
        pg: {
          _id: "$pg._id",
          title: "$pg.title",
          city: "$pg.city",
          area: "$pg.area",
        },
      },
    },
  ];

  if (Number.isInteger(limit) && limit > 0) {
    pipeline.splice(pipeline.length - 1, 0, {
      $limit: limit,
    });
  }

  const rows = await Booking.aggregate(pipeline);

  return rows.map((row) => ({
    ...row,
    totalAmount: safeNumber(row.totalAmount),
  }));
};

const getRevenueBreakdownChart = (revenueSummary) => ({
  labels: ["Paid", "Pending", "Failed"],
  datasets: [
    {
      label: "Revenue",
      data: [
        safeNumber(revenueSummary.paid?.amount),
        safeNumber(revenueSummary.pending?.amount),
        safeNumber(revenueSummary.failed?.amount),
      ],
      colors: ["#10b981", "#f59e0b", "#ef4444"],
    },
  ],
  points: [
    { label: "Paid", value: safeNumber(revenueSummary.paid?.amount), color: "#10b981" },
    { label: "Pending", value: safeNumber(revenueSummary.pending?.amount), color: "#f59e0b" },
    { label: "Failed", value: safeNumber(revenueSummary.failed?.amount), color: "#ef4444" },
  ],
});

const getApprovalBreakdownChart = async (ownerId) => {
  const match = ownerId ? { ownerId: toObjectId(ownerId) } : {};
  const rows = await Pg.aggregate([
    { $match: match },
    {
      $group: {
        _id: "$isApproved",
        count: { $sum: 1 },
      },
    },
  ]);

  const pending = safeNumber(rows.find((row) => row._id === false)?.count);
  const approved = safeNumber(rows.find((row) => row._id === true)?.count);

  return {
    labels: ["Pending", "Approved"],
    datasets: [
      {
        label: "Listings",
        data: [pending, approved],
        colors: ["#f59e0b", "#10b981"],
      },
    ],
    points: [
      { label: "Pending", value: pending, color: "#f59e0b" },
      { label: "Approved", value: approved, color: "#10b981" },
    ],
  };
};

const getPlatformDashboard = async () => {
  const [
    totalUsers,
    totalMessages,
    pgCounts,
    revenueSummary,
    bookingSummary,
    monthlyRevenue,
    bookingTrends,
    topHostels,
    recentTransactions,
    recentPendingPgs,
    recentMessages,
    recentBookings,
    approvalBreakdown,
  ] = await Promise.all([
    User.countDocuments({ $nor: [{ role: "admin" }, { isAdmin: true }] }),
    ContactMessage.countDocuments(),
    Pg.aggregate([
      {
        $group: {
          _id: "$isApproved",
          count: { $sum: 1 },
        },
      },
    ]),
    getRevenueStatusSummary(),
    getBookingStatusSummary(),
    getMonthlyRevenueChart(),
    getMonthlyBookingChart(),
    getTopHostels(),
    getRecentTransactions(),
    Pg.find({ isApproved: false }).populate("ownerId", "name email role isAdmin").sort({ createdAt: -1 }).limit(5).lean(),
    ContactMessage.find().sort({ createdAt: -1 }).limit(5).lean(),
    getRecentBookings(),
    getApprovalBreakdownChart(),
  ]);

  const pendingPgs = safeNumber(pgCounts.find((row) => row._id === false)?.count);
  const approvedPgs = safeNumber(pgCounts.find((row) => row._id === true)?.count);

  return {
    stats: {
      totalUsers: safeNumber(totalUsers),
      totalMessages: safeNumber(totalMessages),
      totalBookings: safeNumber(bookingSummary.pending?.count + bookingSummary.confirmed?.count + bookingSummary.cancelled?.count),
      confirmedBookings: safeNumber(bookingSummary.confirmed?.count),
      pendingBookingStatusCount: safeNumber(bookingSummary.pending?.count),
      activeBookings: safeNumber(bookingSummary.confirmed?.count),
      cancelledBookings: safeNumber(bookingSummary.cancelled?.count),
      pendingPgs,
      approvedPgs,
      totalRevenue: safeNumber(bookingSummary.confirmed?.grossAmount),
      paidRevenue: safeNumber(revenueSummary.paid?.amount),
      pendingRevenue: safeNumber(revenueSummary.pending?.amount),
      failedRevenue: safeNumber(revenueSummary.failed?.amount),
      paidBookings: safeNumber(revenueSummary.paid?.count),
      pendingBookings: safeNumber(revenueSummary.pending?.count),
    },
    charts: {
      monthlyRevenue,
      bookingTrends,
      revenueBreakdown: getRevenueBreakdownChart(revenueSummary),
      approvalBreakdown,
    },
    topHostels,
    recentTransactions,
    recentPendingPgs,
    recentMessages,
    recentBookings,
    lastUpdatedAt: new Date().toISOString(),
  };
};

const getOwnerDashboardAnalytics = async (ownerId) => {
  const [
    pgs,
    revenueSummary,
    bookingSummary,
    monthlyRevenue,
    bookingTrends,
    topHostels,
    recentTransactions,
    recentBookings,
    approvalBreakdown,
  ] = await Promise.all([
    Pg.find({ ownerId }).sort({ createdAt: -1 }).lean(),
    getRevenueStatusSummary(ownerId),
    getBookingStatusSummary(ownerId),
    getMonthlyRevenueChart(ownerId),
    getMonthlyBookingChart(ownerId),
    getTopHostels(ownerId),
    getRecentTransactions(ownerId),
    getRecentBookings(ownerId),
    getApprovalBreakdownChart(ownerId),
  ]);

  return {
    stats: {
      totalPgs: safeNumber(pgs.length),
      totalBookings: safeNumber(bookingSummary.pending?.count + bookingSummary.confirmed?.count + bookingSummary.cancelled?.count),
      confirmedBookings: safeNumber(bookingSummary.confirmed?.count),
      pendingBookingStatusCount: safeNumber(bookingSummary.pending?.count),
      activeBookings: safeNumber(bookingSummary.confirmed?.count),
      cancelledBookings: safeNumber(bookingSummary.cancelled?.count),
      totalAvailableRooms: pgs.reduce((sum, pg) => sum + safeNumber(pg.availableRooms), 0),
      pendingPgs: pgs.filter((pg) => !pg.isApproved).length,
      approvedPgs: pgs.filter((pg) => pg.isApproved).length,
      totalRevenue: safeNumber(bookingSummary.confirmed?.grossAmount),
      paidEarnings: safeNumber(revenueSummary.paid?.amount),
      pendingEarnings: safeNumber(revenueSummary.pending?.amount),
      failedRevenue: safeNumber(revenueSummary.failed?.amount),
      paidBookings: safeNumber(revenueSummary.paid?.count),
      pendingBookings: safeNumber(revenueSummary.pending?.count),
    },
    charts: {
      monthlyRevenue,
      bookingTrends,
      revenueBreakdown: getRevenueBreakdownChart(revenueSummary),
      approvalBreakdown,
    },
    topHostels,
    recentTransactions,
    recentPgs: pgs.slice(0, 5),
    recentBookings,
    lastUpdatedAt: new Date().toISOString(),
  };
};

module.exports = {
  getPlatformDashboard,
  getOwnerDashboardAnalytics,
  getRecentBookings,
};

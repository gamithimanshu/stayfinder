const safeNumber = (value) => {
  const number = Number(value ?? 0);
  return Number.isFinite(number) ? number : 0;
};

const toCurrency = (value) => `Rs. ${Math.round(safeNumber(value)).toLocaleString("en-IN")}`;
const toCount = (value) => Math.round(safeNumber(value)).toLocaleString("en-IN");

export function formatDashboardCurrency(value) {
  return toCurrency(value);
}

export function formatDashboardCount(value) {
  return toCount(value);
}

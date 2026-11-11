export const DEFAULT_DONATION_GOAL = 500000;

export function formatDonationAmount(value) {
  const amount = Number(value);
  return Number.isFinite(amount) ? amount.toLocaleString() : '0';
}

export function calculateDonationPercentage(raised, goal) {
  if (!(goal > 0)) return 0;
  return Math.min(Math.round((raised / goal) * 100), 100);
}

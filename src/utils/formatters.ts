/**
 * Consistent formatting utilities for environmental and transport metrics
 */

export function formatDistance(meters: number): string {
  const roundedMeters = Math.round(meters);
  if (roundedMeters < 1000) {
    return `${roundedMeters} m`;
  }
  return `${(meters / 1000).toFixed(1)} km`;
}

export function formatDuration(seconds: number): string {
  const totalMinutes = Math.round(seconds / 60);
  if (totalMinutes < 60) {
    return `${totalMinutes} min`;
  }
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  if (minutes === 0) {
    return `${hours} hr`;
  }
  return `${hours} hr ${minutes} min`;
}

export function formatEmissions(kgCo2: number): string {
  if (kgCo2 <= 0) {
    return '0.00 kg CO₂';
  }
  if (kgCo2 < 0.1) {
    return `${Math.round(kgCo2 * 1000)} g CO₂`;
  }
  return `${kgCo2.toFixed(2)} kg CO₂`;
}

export function formatCurrency(amount: number | null, symbol: string = '₹'): string {
  if (amount === null) {
    return 'Unavailable';
  }
  return `${symbol}${amount.toFixed(2)}`;
}

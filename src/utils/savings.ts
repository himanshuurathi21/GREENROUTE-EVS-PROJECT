import { TREE_ANNUAL_CO2_SEQUESTRATION_KG } from '../data/emissionFactors';

export interface CommuteSavingsProjection {
  tripsPerWeek: number;
  weeksPerYear: number;
  totalAnnualTrips: number;
  perTripCo2SavedKg: number;
  weeklyCo2SavedKg: number;
  annualCo2SavedKg: number;
  treesEquivalentAnnual: number;
  perTripCostSaved: number | null;
  annualCostSaved: number | null;
  currencySymbol: string;
}

/**
 * Dynamically computes real savings against the user's baseline travel mode:
 * saving = currentCO2 - alternativeCO2
 * For repeated travel: savingPerTrip * actual number of trips
 * No predefined or static values are ever returned.
 */
export function calculateDynamicSavings(
  baselineCo2Kg: number,
  chosenCo2Kg: number,
  tripsPerWeek: number = 5,
  weeksPerYear: number = 48, // Standard work/study year
  baselineCost: number | null = null,
  chosenCost: number | null = null,
  currencySymbol: string = '₹'
): CommuteSavingsProjection {
  const perTripCo2SavedKg = Math.max(0, Number((baselineCo2Kg - chosenCo2Kg).toFixed(3)));
  const weeklyCo2SavedKg = Number((perTripCo2SavedKg * tripsPerWeek).toFixed(2));
  const totalAnnualTrips = tripsPerWeek * weeksPerYear;
  const annualCo2SavedKg = Number((perTripCo2SavedKg * totalAnnualTrips).toFixed(2));

  // Tree sequestration equivalent:
  // Mature tree absorbs ~21.77 kg CO2 / year (EEA & US Forest Service standard)
  const treesEquivalentAnnual = Number((annualCo2SavedKg / TREE_ANNUAL_CO2_SEQUESTRATION_KG).toFixed(1));

  let perTripCostSaved: number | null = null;
  let annualCostSaved: number | null = null;

  if (baselineCost !== null && chosenCost !== null) {
    perTripCostSaved = Number((baselineCost - chosenCost).toFixed(2));
    annualCostSaved = Number((perTripCostSaved * totalAnnualTrips).toFixed(2));
  }

  return {
    tripsPerWeek,
    weeksPerYear,
    totalAnnualTrips,
    perTripCo2SavedKg,
    weeklyCo2SavedKg,
    annualCo2SavedKg,
    treesEquivalentAnnual,
    perTripCostSaved,
    annualCostSaved,
    currencySymbol,
  };
}

import { ModeCostResult } from '../types/cost';
import { ModeEmissionResult } from '../types/emissions';
import { RecommendationScore, RecommendationSummary } from '../types/recommendation';
import { RouteResult, TravelMode } from '../types/routing';

interface ModeEvaluationInputs {
  route: RouteResult;
  emission: ModeEmissionResult;
  cost: ModeCostResult;
}

/**
 * Practical, transparent recommendation engine considering:
 * - Real CO2 emissions (40% weight)
 * - Real practicality & physical feasibility (35% weight)
 * - Real travel time (15% weight)
 * - Real financial cost (10% weight)
 *
 * Never blindly recommends 0-emission walking if the distance is 35 km!
 */
export function generatePracticalRecommendations(
  availableModes: Partial<Record<TravelMode, ModeEvaluationInputs>>,
  baselineMode: TravelMode = 'car'
): RecommendationSummary {
  const modes = Object.keys(availableModes) as TravelMode[];
  if (modes.length === 0) {
    throw new Error('No available routes to evaluate recommendations.');
  }

  // Find minimum duration bound across available real routes
  const durations = modes.map((m) => availableModes[m]!.route.durationMinutes);
  const minDuration = Math.min(...durations);

  const emissions = modes.map((m) => availableModes[m]!.emission.totalCo2Kg);
  const minEmission = Math.min(...emissions);
  const maxEmission = Math.max(...emissions);
  const emissionRange = maxEmission - minEmission;

  const scoresRecord: Partial<Record<TravelMode, RecommendationScore>> = {};

  for (const mode of modes) {
    const { route, emission, cost } = availableModes[mode]!;
    const distanceKm = route.distanceKm;
    const durationMin = route.durationMinutes;
    const co2 = emission.totalCo2Kg;

    // 1. Environmental Score (0 - 100): lowest emitter = 100, highest = 0.
    // If every available mode has the same footprint, none is penalised.
    const environmentalScore = emissionRange > 0.0001
      ? Math.max(0, Math.round(100 - ((co2 - minEmission) / emissionRange) * 100))
      : 100;

    // 2. Practicality Score (0 - 100): Real-world physical feasibility
    let practicalityScore = 95;
    const warnings: string[] = [];
    const reasons: string[] = [];

    if (mode === 'walking') {
      if (distanceKm <= 1.5) {
        practicalityScore = 98;
        reasons.push('Ideal short walking distance (under 1.5 km), zero logistical barrier.');
      } else if (distanceKm <= 3.0) {
        practicalityScore = 80;
        reasons.push('Comfortable 20-35 minute walk for urban errands or light exercise.');
      } else if (distanceKm <= 6.0) {
        practicalityScore = 45;
        warnings.push(`Walking ${distanceKm} km will take ~${durationMin} minutes; feasible only for dedicated walkers.`);
      } else {
        practicalityScore = 10;
        warnings.push(`Distance of ${distanceKm} km (${(durationMin / 60).toFixed(1)} hrs) is impractical for routine walking.`);
      }
    } else if (mode === 'cycling') {
      if (distanceKm <= 5.0) {
        practicalityScore = 96;
        // Compare with the routed car option instead of claiming bikes always
        // beat cars. OSRM durations are the only timing data we actually have.
        const carDuration = availableModes.car?.route.durationMinutes;
        reasons.push(
          carDuration !== undefined && durationMin < carDuration
            ? 'Faster than the routed car option on this corridor, with zero fuel consumption.'
            : 'Short, bike-friendly corridor with zero fuel consumption.'
        );
      } else if (distanceKm <= 12.0) {
        practicalityScore = 85;
        reasons.push(`Moderate cycling commute (~${durationMin} min), excellent health benefit.`);
      } else if (distanceKm <= 22.0) {
        practicalityScore = 55;
        warnings.push(`Cycling ${distanceKm} km requires moderate endurance (~${durationMin} minutes).`);
      } else {
        practicalityScore = 20;
        warnings.push(`At ${distanceKm} km (${(durationMin / 60).toFixed(1)} hrs), cycling requires significant athletic fitness and time commitment.`);
      }
    } else if (mode === 'motorcycle') {
      practicalityScore = 88;
      reasons.push('High maneuverability in traffic with typically lower fuel use than a full-size petrol car.');
      if (distanceKm > 60) {
        warnings.push('Long highway distance on two-wheeler requires adequate riding gear and rest stops.');
      }
    } else if (mode === 'car') {
      practicalityScore = 92;
      reasons.push('High passenger comfort, weather protection, and cargo convenience.');
      if (distanceKm < 2.0) {
        practicalityScore = 65;
        warnings.push('Short driving trip causes cold-engine inefficiencies and urban parking delays.');
      }
    }

    // 3. Time Score (0 - 100): Compare to fastest available mode
    const timeRatio = minDuration / Math.max(durationMin, 1);
    const timeScore = Math.round(timeRatio * 100);

    // 4. Cost Score (0 - 100)
    let costScore = 80;
    if (cost.cost === 0) {
      costScore = 100;
      reasons.push('Zero financial fuel or fare expenditure.');
    } else if (cost.cost !== null) {
      // Scale against the car baseline when one is available.
      const carCost = availableModes.car?.cost.cost;
      if (carCost !== null && carCost !== undefined && carCost > 0) {
        const ratio = cost.cost / carCost;
        costScore = Math.max(20, Math.round(100 - Math.min(ratio, 1.5) * 50));
      }
    } else {
      warnings.push('Verified fare data is unavailable, so cost is excluded from this comparison.');
    }

    // Composite Weighted Score
    // Environmental: 40%, Practicality: 35%, Time: 15%, Cost: 10%
    const totalScore = Math.round(
      environmentalScore * 0.40 +
      practicalityScore * 0.35 +
      timeScore * 0.15 +
      costScore * 0.10
    );

    let tagline = '';
    // The environmental score is relative (lowest emitter = 100), so it cannot
    // be used to claim zero emissions. Only a measured zero CO2 total earns the
    // zero-emission tag.
    if (co2 <= 0.0001 && practicalityScore >= 75) {
      tagline = 'Zero-Emission Eco Champion';
    } else if (timeScore === 100) {
      tagline = 'Fastest Available Route';
    } else if (costScore === 100) {
      tagline = 'Zero Financial Cost';
    } else if (totalScore >= 75) {
      tagline = 'High Practical Efficiency';
    } else {
      tagline = 'Viable Alternative';
    }

    scoresRecord[mode] = {
      mode,
      modeLabel: route.modeLabel,
      totalScore,
      environmentalScore,
      practicalityScore,
      timeScore,
      costScore,
      isRecommended: false,
      tagline,
      reasons,
      warnings,
    };
  }

  // Determine primary recommendation (highest totalScore) among modes that are
  // physically reasonable for a routine trip. Without this feasibility gate a
  // 30 km walk can win on environmental + cost points alone, which is not a
  // practical recommendation. If no mode passes, fall back to all modes.
  const isPrimaryEligible = (mode: TravelMode): boolean => {
    const route = availableModes[mode]!.route;
    if (mode === 'walking') return route.distanceKm <= 5;
    if (mode === 'cycling') return route.distanceKm <= 20;
    return true;
  };

  const eligibleModes = modes.filter(isPrimaryEligible);
  const candidates = eligibleModes.length > 0 ? eligibleModes : modes;

  let bestMode: TravelMode = candidates[0];
  let highestScore = -1;

  for (const m of candidates) {
    const s = scoresRecord[m]!;
    if (s.totalScore > highestScore) {
      highestScore = s.totalScore;
      bestMode = m;
    }
  }

  // Mark recommended
  if (scoresRecord[bestMode]) {
    scoresRecord[bestMode]!.isRecommended = true;
  }

  // Compare against baseline mode (e.g. Car)
  const baselineInput = availableModes[baselineMode] || availableModes[modes[0]]!;
  const bestInput = availableModes[bestMode]!;

  const co2SavedKgVsBaseline = Number(
    Math.max(0, baselineInput.emission.totalCo2Kg - bestInput.emission.totalCo2Kg).toFixed(2)
  );

  const timeDifferenceMinutesVsBaseline =
    bestInput.route.durationMinutes - baselineInput.route.durationMinutes;

  const costDifferenceVsBaseline =
    baselineInput.cost.cost !== null && bestInput.cost.cost !== null
      ? Number((baselineInput.cost.cost - bestInput.cost.cost).toFixed(2))
      : null;

  // Build human-readable rationale
  let recommendedReason = '';
  const bestDistance = bestInput.route.distanceKm;

  if (bestMode === 'cycling') {
    recommendedReason = `Bicycle is recommended for this ${bestDistance} km trip: it produces 0.00 kg CO₂ tailpipe emissions, incurs zero fuel cost, and completes the journey in a realistic ${bestInput.route.durationMinutes} minutes with no parking overhead.`;
  } else if (bestMode === 'walking') {
    recommendedReason = `Walking is recommended for this short ${bestDistance} km journey: zero emissions, zero fuel expenditure, and manageable within ${bestInput.route.durationMinutes} minutes of light physical activity.`;
  } else if (bestMode === 'motorcycle') {
    recommendedReason = `Motorcycle is recommended for this ${bestDistance} km corridor: it cuts fuel consumption and carbon footprint significantly compared to a full-size car while maintaining practical travel velocity (${bestInput.route.durationMinutes} mins).`;
  } else if (bestMode === 'bus' || bestMode === 'metro_train') {
    const transitLabel = bestMode === 'bus' ? 'Public bus' : 'Metro / rapid rail';
    recommendedReason = `${transitLabel} is recommended for this ${bestDistance} km corridor: sharing the journey across passengers produces ${bestInput.emission.co2GramsPerKm} g CO₂ per passenger-km, well below a private car's per-person footprint.`;
  } else {
    // Car (especially if EV or long distance)
    const isEv = bestInput.emission.modeLabel.toLowerCase().includes('electric');
    if (isEv) {
      recommendedReason = `Electric Car is recommended for this ${bestDistance} km trip: it delivers optimal practicality and weather comfort while emitting significantly lower grid-calculated emissions than fossil-fuel alternatives.`;
    } else {
      recommendedReason = `Personal Car is recommended for this ${bestDistance} km trip due to travel distance and practical duration (${bestInput.route.durationMinutes} mins), avoiding the fatigue or time penalties of active modes.`;
    }
  }

  return {
    primaryRecommendation: bestMode,
    recommendedReason,
    allScores: scoresRecord as Record<TravelMode, RecommendationScore>,
    co2SavedKgVsBaseline,
    timeDifferenceMinutesVsBaseline,
    costDifferenceVsBaseline,
  };
}

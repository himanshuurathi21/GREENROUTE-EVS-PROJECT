import { TravelMode } from './routing';

export interface RecommendationScore {
  mode: TravelMode;
  modeLabel: string;
  totalScore: number; // 0 - 100
  environmentalScore: number; // 0 - 100
  practicalityScore: number; // 0 - 100
  timeScore: number; // 0 - 100
  costScore: number; // 0 - 100
  isRecommended: boolean;
  tagline: string;
  reasons: string[];
  warnings: string[];
}

export interface RecommendationSummary {
  primaryRecommendation: TravelMode;
  recommendedReason: string;
  allScores: Record<TravelMode, RecommendationScore>;
  co2SavedKgVsBaseline: number;
  timeDifferenceMinutesVsBaseline: number;
  costDifferenceVsBaseline: number | null;
}

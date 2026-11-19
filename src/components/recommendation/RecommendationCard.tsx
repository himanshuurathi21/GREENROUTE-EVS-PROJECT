import React from 'react';
import { Award, CheckCircle2, AlertTriangle } from 'lucide-react';
import { RecommendationSummary } from '../../types/recommendation';
import { RouteResult, TravelMode } from '../../types/routing';

interface RecommendationCardProps {
  recommendation: RecommendationSummary;
  activeRoute: RouteResult;
  onApplyRecommended: (mode: TravelMode) => void;
}

export const RecommendationCard: React.FC<RecommendationCardProps> = ({
  recommendation,
  activeRoute,
  onApplyRecommended,
}) => {
  const recMode = recommendation.primaryRecommendation;
  const score = recommendation.allScores[recMode];
  const isCurrentlySelected = activeRoute.mode === recMode;

  return (
    <div className="bg-white rounded-lg border border-forest/30 overflow-hidden shadow-card">
      <div className="bg-forest px-5 py-3 text-white flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Award className="w-5 h-5 text-accent" />
          <span className="font-semibold text-sm tracking-wide">
            Optimal Practical Recommendation
          </span>
        </div>
        <span className="text-xs bg-forest-dark px-2.5 py-1 rounded font-medium border border-white/20">
          Composite Score: {score?.totalScore || 0}/100
        </span>
      </div>

      <div className="p-5 space-y-4">
        {/* Recommendation Headline */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-accent-dark/30 pb-4">
          <div>
            <div className="flex items-center space-x-2">
              <h4 className="text-base font-bold text-slate-dark capitalize">
                {score?.modeLabel}
              </h4>
              <span className="text-xs px-2 py-0.5 rounded bg-accent text-forest-dark font-semibold">
                {score?.tagline}
              </span>
            </div>
            <p className="text-xs text-mineral mt-1 leading-relaxed">
              {recommendation.recommendedReason}
            </p>
          </div>

          {!isCurrentlySelected && (
            <button
              onClick={() => onApplyRecommended(recMode)}
              className="shrink-0 px-4 py-2 bg-forest hover:bg-forest-hover text-white text-xs font-semibold rounded shadow-subtle transition-colors"
            >
              Switch to {score?.modeLabel}
            </button>
          )}
        </div>

        {/* Multi-Criteria Score Breakdown */}
        <div>
          <h5 className="text-xs font-semibold text-slate-dark uppercase tracking-wider mb-2.5">
            Transparent Decision Criteria (Weighted Multi-Attribute Scoring)
          </h5>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            <div className="p-2.5 bg-canvas rounded border border-accent-dark/40">
              <span className="text-[11px] text-mineral block">Environmental (40%)</span>
              <div className="flex items-baseline justify-between mt-1">
                <span className="font-bold text-forest text-sm">{score?.environmentalScore}%</span>
                <span className="text-[10px] text-mineral">CO₂ impact</span>
              </div>
            </div>

            <div className="p-2.5 bg-canvas rounded border border-accent-dark/40">
              <span className="text-[11px] text-mineral block">Practicality (35%)</span>
              <div className="flex items-baseline justify-between mt-1">
                <span className="font-bold text-slate-dark text-sm">{score?.practicalityScore}%</span>
                <span className="text-[10px] text-mineral">feasibility</span>
              </div>
            </div>

            <div className="p-2.5 bg-canvas rounded border border-accent-dark/40">
              <span className="text-[11px] text-mineral block">Travel Time (15%)</span>
              <div className="flex items-baseline justify-between mt-1">
                <span className="font-bold text-slate-dark text-sm">{score?.timeScore}%</span>
                <span className="text-[10px] text-mineral">velocity</span>
              </div>
            </div>

            <div className="p-2.5 bg-canvas rounded border border-accent-dark/40">
              <span className="text-[11px] text-mineral block">Operating Cost (10%)</span>
              <div className="flex items-baseline justify-between mt-1">
                <span className="font-bold text-slate-dark text-sm">{score?.costScore}%</span>
                <span className="text-[10px] text-mineral">economy</span>
              </div>
            </div>
          </div>
        </div>

        {/* Real Data Reasons & Disclaimers */}
        <div className="space-y-1.5 pt-1">
          {score?.reasons.map((r, i) => (
            <div key={i} className="flex items-start space-x-2 text-xs text-mineral-dark">
              <CheckCircle2 className="w-3.5 h-3.5 text-forest shrink-0 mt-0.5" />
              <span>{r}</span>
            </div>
          ))}

          {score?.warnings.map((w, i) => (
            <div key={i} className="flex items-start space-x-2 text-xs text-[#7A5826] bg-[#FAF6EE] p-2 rounded border border-[#ECE0C8]">
              <AlertTriangle className="w-3.5 h-3.5 text-[#B87A29] shrink-0 mt-0.5" />
              <span>{w}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

import React from 'react';

interface FreshnessGaugeProps {
  percentage: number; // 0 - 100
  remainingHours?: number;
  totalHours?: number;
  size?: 'sm' | 'md' | 'lg' | 'mini';
  showLabel?: boolean;
  showHours?: boolean;
  className?: string;
  predictedRiskLevel?: 'low' | 'medium' | 'high' | 'critical';
}

export const getFreshnessColor = (percent: number) => {
  if (percent >= 70) {
    return {
      stroke: '#5C7A50', // Olive-sage green
      textClass: 'text-[#5C7A50]',
      bgRing: '#E2EBE0',
      label: 'Optimal',
      badgeBg: 'bg-[#5C7A50]/10 text-[#5C7A50] border-[#5C7A50]/30',
    };
  }
  if (percent >= 36) {
    return {
      stroke: '#D98E2B', // Harvest amber
      textClass: 'text-[#D98E2B]',
      bgRing: '#FCEFD9',
      label: 'Moderate Risk',
      badgeBg: 'bg-[#D98E2B]/10 text-[#D98E2B] border-[#D98E2B]/30',
    };
  }
  return {
    stroke: '#B3462C', // Muted brick red
    textClass: 'text-[#B3462C]',
    bgRing: '#FCEBE6',
    label: 'Critical / Disrupted',
    badgeBg: 'bg-[#B3462C]/10 text-[#B3462C] border-[#B3462C]/30',
  };
};

export const FreshnessGauge: React.FC<FreshnessGaugeProps> = ({
  percentage,
  remainingHours,
  totalHours,
  size = 'md',
  showLabel = false,
  showHours = false,
  className = '',
  predictedRiskLevel,
}) => {
  const clampedPercent = Math.max(0, Math.min(100, Math.round(percentage)));
  const { stroke, bgRing, textClass, label, badgeBg } = getFreshnessColor(clampedPercent);

  // Dimension settings
  const config = {
    mini: { dimension: 28, strokeWidth: 3.5, radius: 10, fontSize: 'text-[9px]' },
    sm: { dimension: 48, strokeWidth: 4, radius: 18, fontSize: 'text-[11px]' },
    md: { dimension: 64, strokeWidth: 6, radius: 24, fontSize: 'text-sm' },
    lg: { dimension: 96, strokeWidth: 8, radius: 36, fontSize: 'text-xl' },
  }[size];

  // SVG Arc calculation for a 240 degree gauge (or 360 full circular decaying arc)
  // Let's use an open 260-degree technical arc gauge
  const circumference = 2 * Math.PI * config.radius;
  // Arc factor: 260 deg / 360 deg = 0.722
  const arcLength = circumference * 0.75;
  const strokeDashoffset = arcLength - (arcLength * clampedPercent) / 100;

  return (
    <div className={`inline-flex items-center gap-2 ${className}`}>
      <div className="relative inline-flex items-center justify-center">
        <svg
          width={config.dimension}
          height={config.dimension}
          viewBox={`0 0 ${config.dimension} ${config.dimension}`}
          className="transform -rotate-90"
        >
          {/* Background track */}
          <circle
            cx={config.dimension / 2}
            cy={config.dimension / 2}
            r={config.radius}
            fill="none"
            stroke={bgRing}
            strokeWidth={config.strokeWidth}
            strokeDasharray={`${circumference} ${circumference}`}
            strokeLinecap="round"
          />
          {/* Active decaying freshness arc */}
          <circle
            cx={config.dimension / 2}
            cy={config.dimension / 2}
            r={config.radius}
            fill="none"
            stroke={stroke}
            strokeWidth={config.strokeWidth}
            strokeDasharray={`${circumference} ${circumference}`}
            strokeDashoffset={circumference - (circumference * clampedPercent) / 100}
            strokeLinecap="round"
            className="transition-all duration-700 ease-out"
          />
        </svg>

        {/* Center Percentage Display */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className={`font-mono font-bold ${config.fontSize} ${textClass} tracking-tight leading-none`}>
            {clampedPercent}%
          </span>
        </div>
      </div>

      {(showLabel || showHours) && (
        <div className="flex flex-col text-left">
          {showLabel && (
            <span className={`text-xs font-medium ${textClass} tracking-tight flex items-center gap-1`}>
              <span
                className={`inline-block w-1.5 h-1.5 rounded-full ${
                  clampedPercent < 36 ? 'animate-pulse bg-[#B3462C]' : clampedPercent < 70 ? 'bg-[#D98E2B]' : 'bg-[#5C7A50]'
                }`}
              />
              {label}
              {predictedRiskLevel && (
                <span className={`ml-1 px-1.5 py-0.5 rounded text-[10px] uppercase font-bold border border-transparent ${
                  predictedRiskLevel === 'critical' ? 'bg-[#B3462C]/10 text-[#B3462C] border-[#B3462C]/30' :
                  predictedRiskLevel === 'high' ? 'bg-[#D98E2B]/20 text-[#D98E2B] border-[#D98E2B]/30' :
                  predictedRiskLevel === 'medium' ? 'bg-[#D98E2B]/10 text-[#D98E2B] border-[#D98E2B]/20' :
                  'bg-[#5C7A50]/10 text-[#5C7A50] border-[#5C7A50]/30'
                }`}>
                  AI Risk: {predictedRiskLevel}
                </span>
              )}
            </span>
          )}
          {showHours && remainingHours !== undefined && (
            <span className="font-mono text-[11px] text-[#596560]">
              <span className="text-[#1A211E] font-semibold">{remainingHours}h</span>
              {totalHours ? ` / ${totalHours}h left` : ' shelf-life'}
            </span>
          )}
        </div>
      )}
    </div>
  );
};

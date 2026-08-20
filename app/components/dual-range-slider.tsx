"use client";

export default function DualRangeSlider({
  label,
  min,
  max,
  step,
  value,
  onChange,
  unit,
}: {
  label: string;
  min: number;
  max: number;
  step: number;
  value: [number, number];
  onChange: (value: [number, number]) => void;
  unit: string;
}) {
  const [minVal, maxVal] = value;
  const minPercent = ((minVal - min) / (max - min)) * 100;
  const maxPercent = ((maxVal - min) / (max - min)) * 100;

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-baseline justify-between">
        <span className="text-sm font-medium">{label}</span>
        <span className="text-xs text-zinc-500 dark:text-zinc-400">
          {minVal} – {maxVal >= max ? `${max}+` : maxVal} {unit}
        </span>
      </div>

      <div className="relative h-7">
        <div className="absolute top-1/2 h-1 w-full -translate-y-1/2 rounded-full bg-black/10 dark:bg-white/15" />
        <div
          className="absolute top-1/2 h-1 -translate-y-1/2 rounded-full bg-foreground"
          style={{ left: `${minPercent}%`, right: `${100 - maxPercent}%` }}
        />
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={minVal}
          onChange={(e) => onChange([Math.min(Number(e.target.value), maxVal), maxVal])}
          className="dual-range-input"
          aria-label={`${label} från`}
        />
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={maxVal}
          onChange={(e) => onChange([minVal, Math.max(Number(e.target.value), minVal)])}
          className="dual-range-input"
          aria-label={`${label} till`}
        />
      </div>
    </div>
  );
}

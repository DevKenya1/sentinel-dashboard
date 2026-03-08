import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface HealthGaugeProps {
  score: number; // 0-100
}

export function HealthGauge({ score }: HealthGaugeProps) {
  const radius = 54;
  const circumference = 2 * Math.PI * radius;
  const pct = Math.min(Math.max(score, 0), 100);
  const offset = circumference - (pct / 100) * circumference;

  const color =
    pct >= 80 ? "text-success" :
    pct >= 50 ? "text-warning" :
    "text-destructive";

  const label =
    pct >= 80 ? "HEALTHY" :
    pct >= 50 ? "DEGRADED" :
    "CRITICAL";

  return (
    <div className="flex flex-col items-center">
      <div className="relative w-32 h-32">
        <svg viewBox="0 0 120 120" className="w-full h-full -rotate-90">
          <circle
            cx="60" cy="60" r={radius}
            fill="none"
            stroke="hsl(var(--secondary))"
            strokeWidth="8"
          />
          <motion.circle
            cx="60" cy="60" r={radius}
            fill="none"
            stroke="currentColor"
            strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray={circumference}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset: offset }}
            transition={{ duration: 1.2, ease: "easeOut" }}
            className={color}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className={cn("text-2xl font-bold font-mono", color)}>{pct}%</span>
          <span className="text-[9px] font-mono text-muted-foreground tracking-widest">{label}</span>
        </div>
      </div>
    </div>
  );
}

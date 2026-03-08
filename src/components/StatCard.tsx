import { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface StatCardProps {
  title: string;
  value: string | number;
  icon: ReactNode;
  trend?: string;
  trendUp?: boolean;
  variant?: "default" | "danger" | "warning" | "success";
}

const variantStyles = {
  default: "border-border hover:border-primary/30 hover:glow-primary",
  danger: "border-destructive/30 hover:glow-destructive",
  warning: "border-warning/30",
  success: "border-success/30 hover:glow-accent",
};

const iconBgStyles = {
  default: "bg-primary/10 text-primary",
  danger: "bg-destructive/10 text-destructive",
  warning: "bg-warning/10 text-warning",
  success: "bg-success/10 text-success",
};

export function StatCard({ title, value, icon, trend, trendUp, variant = "default" }: StatCardProps) {
  return (
    <div className={cn(
      "rounded-lg border bg-card p-5 transition-all duration-300",
      variantStyles[variant]
    )}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">{title}</p>
          <p className="mt-2 text-3xl font-bold font-mono text-foreground">{value}</p>
          {trend && (
            <p className={cn(
              "mt-1 text-xs font-mono",
              trendUp ? "text-destructive" : "text-success"
            )}>
              {trend}
            </p>
          )}
        </div>
        <div className={cn("rounded-lg p-2.5", iconBgStyles[variant])}>
          {icon}
        </div>
      </div>
    </div>
  );
}

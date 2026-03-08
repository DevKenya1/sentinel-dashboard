import { motion } from "framer-motion";
import { Filter, Bell, ShieldAlert, ShieldCheck, AlertTriangle, Info } from "lucide-react";
import { useState, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

const severityConfig: Record<string, { bg: string; icon: typeof ShieldAlert; dot: string }> = {
  critical: { bg: "bg-destructive/20 text-destructive border-destructive/30", icon: ShieldAlert, dot: "bg-destructive" },
  high: { bg: "bg-warning/20 text-warning border-warning/30", icon: AlertTriangle, dot: "bg-warning" },
  medium: { bg: "bg-info/20 text-info border-info/30", icon: Info, dot: "bg-info" },
  low: { bg: "bg-success/20 text-success border-success/30", icon: ShieldCheck, dot: "bg-success" },
};

const statusColors: Record<string, string> = {
  active: "text-destructive",
  investigating: "text-warning",
  resolved: "text-success",
};

export default function Alerts() {
  const [filter, setFilter] = useState<string>("all");
  const queryClient = useQueryClient();

  const { data: allAlerts = [] } = useQuery({
    queryKey: ["alerts"],
    queryFn: async () => {
      const { data } = await supabase.from("security_alerts").select("*").order("created_at", { ascending: false });
      return data ?? [];
    },
  });

  // Realtime subscription for new alerts
  useEffect(() => {
    const channel = supabase
      .channel("alerts-realtime")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "security_alerts" }, () => {
        queryClient.invalidateQueries({ queryKey: ["alerts"] });
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [queryClient]);

  const filtered = filter === "all" ? allAlerts : allAlerts.filter((a) => a.severity === filter);
  const isAI = (msg: string) => msg.startsWith("[AI]");

  const counts = {
    critical: allAlerts.filter((a) => a.severity === "critical").length,
    high: allAlerts.filter((a) => a.severity === "high").length,
    medium: allAlerts.filter((a) => a.severity === "medium").length,
    low: allAlerts.filter((a) => a.severity === "low").length,
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6 max-w-7xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Security Alerts</h1>
          <p className="text-sm text-muted-foreground font-mono mt-1">
            {allAlerts.length} total alerts • {allAlerts.filter((a) => a.status === "active").length} active
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-muted-foreground" />
          {["all", "critical", "high", "medium", "low"].map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-2.5 py-1 text-[10px] font-mono uppercase rounded border transition-colors ${
                filter === f ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground hover:text-foreground"
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {/* Severity summary cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {(["critical", "high", "medium", "low"] as const).map((sev) => {
          const cfg = severityConfig[sev];
          const Icon = cfg.icon;
          return (
            <button
              key={sev}
              onClick={() => setFilter(filter === sev ? "all" : sev)}
              className={`rounded-lg border p-3 flex items-center gap-3 transition-all ${
                filter === sev ? cfg.bg : "border-border bg-card hover:bg-muted/50"
              }`}
            >
              <Icon className={`h-5 w-5 ${filter === sev ? "" : "text-muted-foreground"}`} />
              <div className="text-left">
                <p className="text-xl font-bold font-mono">{counts[sev]}</p>
                <p className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">{sev}</p>
              </div>
            </button>
          );
        })}
      </div>

      {/* Alerts table */}
      <div className="rounded-lg border border-border bg-card overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border bg-secondary/30">
              <th className="px-4 py-3 text-left text-[10px] font-mono uppercase tracking-widest text-muted-foreground">Severity</th>
              <th className="px-4 py-3 text-left text-[10px] font-mono uppercase tracking-widest text-muted-foreground">Type</th>
              <th className="px-4 py-3 text-left text-[10px] font-mono uppercase tracking-widest text-muted-foreground hidden lg:table-cell">Source → Target</th>
              <th className="px-4 py-3 text-left text-[10px] font-mono uppercase tracking-widest text-muted-foreground">Message</th>
              <th className="px-4 py-3 text-left text-[10px] font-mono uppercase tracking-widest text-muted-foreground hidden md:table-cell">Time</th>
              <th className="px-4 py-3 text-left text-[10px] font-mono uppercase tracking-widest text-muted-foreground">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {filtered.map((alert, i) => {
              const cfg = severityConfig[alert.severity] || severityConfig.medium;
              const ai = isAI(alert.message);
              return (
                <motion.tr
                  key={alert.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: Math.min(i * 0.03, 0.5) }}
                  className={`hover:bg-secondary/30 transition-colors ${
                    alert.severity === "critical" ? "bg-destructive/5" : ""
                  }`}
                >
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <span className={`h-2 w-2 rounded-full ${cfg.dot} ${alert.status === "active" ? "animate-pulse" : ""}`} />
                      <span className={`inline-flex items-center rounded border px-1.5 py-0.5 text-[10px] font-mono font-bold uppercase ${cfg.bg}`}>
                        {alert.severity}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm font-mono text-foreground">{alert.type}</td>
                  <td className="px-4 py-3 text-xs font-mono text-muted-foreground hidden lg:table-cell">
                    <span className="text-primary">{alert.source_ip}</span> → {alert.target}
                  </td>
                  <td className="px-4 py-3 text-sm max-w-xs truncate">
                    {ai && (
                      <span className="inline-flex items-center gap-1 mr-1.5 px-1.5 py-0.5 rounded bg-primary/10 text-primary text-[10px] font-mono font-bold">
                        <Bell className="h-2.5 w-2.5" /> AI
                      </span>
                    )}
                    <span className="text-foreground">{ai ? alert.message.slice(5) : alert.message}</span>
                  </td>
                  <td className="px-4 py-3 text-xs font-mono text-muted-foreground hidden md:table-cell">
                    {new Date(alert.created_at).toLocaleString()}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-xs font-mono capitalize ${statusColors[alert.status]}`}>
                      ● {alert.status}
                    </span>
                  </td>
                </motion.tr>
              );
            })}
          </tbody>
        </table>
        {filtered.length === 0 && (
          <div className="p-8 text-center text-sm text-muted-foreground font-mono">No alerts match the current filter.</div>
        )}
      </div>
    </motion.div>
  );
}

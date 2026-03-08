import { motion } from "framer-motion";
import { Filter } from "lucide-react";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

const severityColors: Record<string, string> = {
  critical: "bg-destructive/20 text-destructive border-destructive/30",
  high: "bg-warning/20 text-warning border-warning/30",
  medium: "bg-info/20 text-info border-info/30",
  low: "bg-muted text-muted-foreground border-border",
};

const statusColors: Record<string, string> = {
  active: "text-destructive",
  investigating: "text-warning",
  resolved: "text-success",
};

export default function Alerts() {
  const [filter, setFilter] = useState<string>("all");

  const { data: allAlerts = [] } = useQuery({
    queryKey: ["alerts"],
    queryFn: async () => {
      const { data } = await supabase.from("security_alerts").select("*").order("created_at", { ascending: false });
      return data ?? [];
    },
  });

  const filtered = filter === "all" ? allAlerts : allAlerts.filter(a => a.severity === filter);

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6 max-w-7xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Security Alerts</h1>
          <p className="text-sm text-muted-foreground font-mono mt-1">{allAlerts.length} total alerts • {allAlerts.filter(a => a.status === "active").length} active</p>
        </div>
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-muted-foreground" />
          {["all", "critical", "high", "medium", "low"].map(f => (
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
            {filtered.map((alert, i) => (
              <motion.tr
                key={alert.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05 }}
                className="hover:bg-secondary/30 transition-colors"
              >
                <td className="px-4 py-3">
                  <span className={`inline-flex items-center rounded border px-1.5 py-0.5 text-[10px] font-mono font-bold uppercase ${severityColors[alert.severity]}`}>
                    {alert.severity}
                  </span>
                </td>
                <td className="px-4 py-3 text-sm font-mono">{alert.type}</td>
                <td className="px-4 py-3 text-xs font-mono text-muted-foreground hidden lg:table-cell">
                  {alert.source_ip} → {alert.target}
                </td>
                <td className="px-4 py-3 text-sm max-w-xs truncate">{alert.message}</td>
                <td className="px-4 py-3 text-xs font-mono text-muted-foreground hidden md:table-cell">{new Date(alert.created_at).toLocaleString()}</td>
                <td className="px-4 py-3">
                  <span className={`text-xs font-mono capitalize ${statusColors[alert.status]}`}>
                    ● {alert.status}
                  </span>
                </td>
              </motion.tr>
            ))}
          </tbody>
        </table>
      </div>
    </motion.div>
  );
}

import { Shield, Wifi, AlertTriangle, Bug, Server, Globe } from "lucide-react";
import { StatCard } from "@/components/StatCard";
import { motion } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.08 } },
};
const item = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4 } },
};

const severityColors: Record<string, string> = {
  critical: "bg-destructive/20 text-destructive border-destructive/30",
  high: "bg-warning/20 text-warning border-warning/30",
  medium: "bg-info/20 text-info border-info/30",
  low: "bg-muted text-muted-foreground border-border",
};

export default function Dashboard() {
  const { data: alerts = [] } = useQuery({
    queryKey: ["dashboard-alerts"],
    queryFn: async () => {
      const { data } = await supabase.from("security_alerts").select("*").order("created_at", { ascending: false }).limit(5);
      return data ?? [];
    },
  });

  const { data: stats } = useQuery({
    queryKey: ["dashboard-stats"],
    queryFn: async () => {
      const [alertsRes, devicesRes] = await Promise.all([
        supabase.from("security_alerts").select("*"),
        supabase.from("network_devices").select("*"),
      ]);
      const allAlerts = alertsRes.data ?? [];
      const allDevices = devicesRes.data ?? [];
      const uniqueIps = new Set(allAlerts.map(a => a.source_ip));
      return {
        threats: allAlerts.length,
        suspiciousIps: uniqueIps.size,
        devices: allDevices.length,
        activeAlerts: allAlerts.filter(a => a.status === "active").length,
        criticalCount: allAlerts.filter(a => a.severity === "critical").length,
      };
    },
  });

  const { data: threats = [] } = useQuery({
    queryKey: ["dashboard-threats"],
    queryFn: async () => {
      const { data } = await supabase.from("security_alerts").select("type");
      if (!data) return [];
      const counts: Record<string, number> = {};
      data.forEach(a => { counts[a.type] = (counts[a.type] || 0) + 1; });
      const total = data.length;
      return Object.entries(counts)
        .map(([type, count]) => ({ type, count, pct: Math.round((count / total) * 100) }))
        .sort((a, b) => b.count - a.count);
    },
  });

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-6 max-w-7xl">
      <motion.div variants={item}>
        <h1 className="text-2xl font-bold tracking-tight">Security Operations Center</h1>
        <p className="text-sm text-muted-foreground font-mono mt-1">Real-time threat monitoring • Last scan: 30s ago</p>
      </motion.div>

      <motion.div variants={item} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Threats Detected" value={stats?.threats ?? 0} icon={<Bug className="h-5 w-5" />} trend={`${stats?.criticalCount ?? 0} critical`} trendUp variant="danger" />
        <StatCard title="Suspicious IPs" value={stats?.suspiciousIps ?? 0} icon={<Globe className="h-5 w-5" />} variant="warning" />
        <StatCard title="Network Devices" value={stats?.devices ?? 0} icon={<Server className="h-5 w-5" />} variant="success" />
        <StatCard title="Active Alerts" value={stats?.activeAlerts ?? 0} icon={<AlertTriangle className="h-5 w-5" />} trend={`${stats?.criticalCount ?? 0} critical`} trendUp variant="danger" />
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <motion.div variants={item} className="lg:col-span-2 rounded-lg border border-border bg-card">
          <div className="flex items-center justify-between border-b border-border px-5 py-3">
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-destructive animate-pulse" />
              <h2 className="text-sm font-semibold">Live Security Alerts</h2>
            </div>
            <span className="text-[10px] font-mono text-muted-foreground">{alerts.length} RECENT</span>
          </div>
          <div className="divide-y divide-border">
            {alerts.map((alert) => (
              <div key={alert.id} className="flex items-start gap-3 px-5 py-3 hover:bg-secondary/50 transition-colors">
                <span className={`mt-0.5 inline-flex items-center rounded border px-1.5 py-0.5 text-[10px] font-mono font-bold uppercase ${severityColors[alert.severity]}`}>
                  {alert.severity}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-foreground truncate">{alert.message}</p>
                  <p className="text-[10px] font-mono text-muted-foreground mt-0.5">
                    IP: {alert.source_ip} • {new Date(alert.created_at).toLocaleTimeString()}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        <motion.div variants={item} className="rounded-lg border border-border bg-card">
          <div className="border-b border-border px-5 py-3">
            <h2 className="text-sm font-semibold">Threat Breakdown</h2>
          </div>
          <div className="p-5 space-y-4">
            {threats.map((t) => (
              <div key={t.type}>
                <div className="flex justify-between text-xs mb-1">
                  <span className="font-mono text-muted-foreground">{t.type}</span>
                  <span className="font-mono text-foreground">{t.count} ({t.pct}%)</span>
                </div>
                <div className="h-1.5 rounded-full bg-secondary overflow-hidden">
                  <motion.div
                    className="h-full rounded-full bg-primary"
                    initial={{ width: 0 }}
                    animate={{ width: `${t.pct}%` }}
                    transition={{ duration: 0.8, delay: 0.3 }}
                  />
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      <motion.div variants={item} className="rounded-lg border border-border bg-card">
        <div className="border-b border-border px-5 py-3">
          <h2 className="text-sm font-semibold">Network Activity Timeline</h2>
        </div>
        <div className="p-5 grid grid-cols-12 gap-1 h-20">
          {Array.from({ length: 48 }).map((_, i) => {
            const height = Math.random() * 100;
            const isHigh = height > 70;
            return (
              <motion.div
                key={i}
                className={`rounded-sm ${isHigh ? 'bg-destructive/60' : 'bg-primary/40'}`}
                initial={{ scaleY: 0 }}
                animate={{ scaleY: 1 }}
                transition={{ duration: 0.3, delay: i * 0.02 }}
                style={{ height: `${Math.max(height, 8)}%`, alignSelf: "end" }}
              />
            );
          })}
        </div>
        <div className="flex justify-between px-5 pb-3 text-[10px] font-mono text-muted-foreground">
          <span>24h ago</span>
          <span>12h ago</span>
          <span>Now</span>
        </div>
      </motion.div>
    </motion.div>
  );
}

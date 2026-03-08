import { Shield, Wifi, AlertTriangle, Bug, Server, Globe } from "lucide-react";
import { StatCard } from "@/components/StatCard";
import { motion } from "framer-motion";

const mockAlerts = [
  { id: 1, severity: "critical", message: "Brute force attack detected from 192.168.1.105", time: "2 min ago", ip: "192.168.1.105" },
  { id: 2, severity: "high", message: "Suspicious outbound traffic on port 4444", time: "5 min ago", ip: "10.0.0.23" },
  { id: 3, severity: "medium", message: "Failed SSH login attempts exceeded threshold", time: "12 min ago", ip: "172.16.0.88" },
  { id: 4, severity: "critical", message: "Malware signature detected in network payload", time: "18 min ago", ip: "192.168.2.41" },
  { id: 5, severity: "low", message: "New device connected to network segment B", time: "25 min ago", ip: "10.0.1.15" },
];

const severityColors: Record<string, string> = {
  critical: "bg-destructive/20 text-destructive border-destructive/30",
  high: "bg-warning/20 text-warning border-warning/30",
  medium: "bg-info/20 text-info border-info/30",
  low: "bg-muted text-muted-foreground border-border",
};

const threatData = [
  { type: "DDoS", count: 23, pct: 35 },
  { type: "Malware", count: 18, pct: 27 },
  { type: "Phishing", count: 12, pct: 18 },
  { type: "Brute Force", count: 8, pct: 12 },
  { type: "SQL Injection", count: 5, pct: 8 },
];

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.08 } },
};
const item = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4 } },
};

export default function Dashboard() {
  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-6 max-w-7xl">
      <motion.div variants={item}>
        <h1 className="text-2xl font-bold tracking-tight">Security Operations Center</h1>
        <p className="text-sm text-muted-foreground font-mono mt-1">Real-time threat monitoring • Last scan: 30s ago</p>
      </motion.div>

      {/* Stats */}
      <motion.div variants={item} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Threats Detected" value={156} icon={<Bug className="h-5 w-5" />} trend="↑ 12% from last hour" trendUp variant="danger" />
        <StatCard title="Suspicious IPs" value={42} icon={<Globe className="h-5 w-5" />} trend="↑ 8 new" trendUp variant="warning" />
        <StatCard title="Network Devices" value={284} icon={<Server className="h-5 w-5" />} trend="3 new discovered" variant="success" />
        <StatCard title="Active Alerts" value={23} icon={<AlertTriangle className="h-5 w-5" />} trend="5 critical" trendUp variant="danger" />
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Live Alerts */}
        <motion.div variants={item} className="lg:col-span-2 rounded-lg border border-border bg-card">
          <div className="flex items-center justify-between border-b border-border px-5 py-3">
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-destructive animate-pulse" />
              <h2 className="text-sm font-semibold">Live Security Alerts</h2>
            </div>
            <span className="text-[10px] font-mono text-muted-foreground">{mockAlerts.length} ACTIVE</span>
          </div>
          <div className="divide-y divide-border">
            {mockAlerts.map((alert) => (
              <div key={alert.id} className="flex items-start gap-3 px-5 py-3 hover:bg-secondary/50 transition-colors">
                <span className={`mt-0.5 inline-flex items-center rounded border px-1.5 py-0.5 text-[10px] font-mono font-bold uppercase ${severityColors[alert.severity]}`}>
                  {alert.severity}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-foreground truncate">{alert.message}</p>
                  <p className="text-[10px] font-mono text-muted-foreground mt-0.5">
                    IP: {alert.ip} • {alert.time}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Threat Breakdown */}
        <motion.div variants={item} className="rounded-lg border border-border bg-card">
          <div className="border-b border-border px-5 py-3">
            <h2 className="text-sm font-semibold">Threat Breakdown</h2>
          </div>
          <div className="p-5 space-y-4">
            {threatData.map((t) => (
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

      {/* Network Activity */}
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

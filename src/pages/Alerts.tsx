import { motion } from "framer-motion";
import { AlertTriangle, Shield, Filter } from "lucide-react";
import { useState } from "react";

const allAlerts = [
  { id: 1, severity: "critical", type: "Intrusion", source: "192.168.1.105", target: "10.0.0.1", message: "Brute force SSH attack - 500+ failed attempts", time: "2025-03-08 14:32:01", status: "active" },
  { id: 2, severity: "critical", type: "Malware", source: "192.168.2.41", target: "10.0.0.5", message: "Trojan signature detected in HTTP payload", time: "2025-03-08 14:28:45", status: "active" },
  { id: 3, severity: "high", type: "Exfiltration", source: "10.0.0.23", target: "ext:45.33.32.156", message: "Suspicious outbound data transfer (4.2GB)", time: "2025-03-08 14:25:12", status: "investigating" },
  { id: 4, severity: "high", type: "Scanning", source: "172.16.0.88", target: "10.0.0.0/24", message: "Port scanning detected across subnet", time: "2025-03-08 14:18:33", status: "active" },
  { id: 5, severity: "medium", type: "Authentication", source: "10.0.1.15", target: "auth-server", message: "Multiple failed MFA attempts from single user", time: "2025-03-08 14:12:07", status: "resolved" },
  { id: 6, severity: "medium", type: "Policy", source: "10.0.0.99", target: "firewall", message: "Firewall rule bypass attempt detected", time: "2025-03-08 14:05:55", status: "investigating" },
  { id: 7, severity: "low", type: "Network", source: "10.0.1.200", target: "switch-04", message: "New device connected to monitored segment", time: "2025-03-08 13:58:22", status: "resolved" },
  { id: 8, severity: "critical", type: "Ransomware", source: "192.168.3.12", target: "file-server-01", message: "File encryption activity detected", time: "2025-03-08 13:52:10", status: "active" },
];

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
                  {alert.source} → {alert.target}
                </td>
                <td className="px-4 py-3 text-sm max-w-xs truncate">{alert.message}</td>
                <td className="px-4 py-3 text-xs font-mono text-muted-foreground hidden md:table-cell">{alert.time}</td>
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

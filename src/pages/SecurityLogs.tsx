import { motion } from "framer-motion";
import { FileText } from "lucide-react";

const logs = [
  { id: 1, timestamp: "2025-03-08 14:32:01.234", level: "ERROR", source: "firewall-01", message: "Blocked incoming connection from 192.168.1.105:4444 → 10.0.0.1:22 (SSH brute force)" },
  { id: 2, timestamp: "2025-03-08 14:31:58.891", level: "WARN", source: "ids-sensor-03", message: "Signature match: ET TROJAN Generic RAT CnC Beacon" },
  { id: 3, timestamp: "2025-03-08 14:31:55.102", level: "INFO", source: "auth-server", message: "User admin@corp.local authenticated via MFA (TOTP)" },
  { id: 4, timestamp: "2025-03-08 14:31:50.445", level: "ERROR", source: "waf-proxy", message: "SQL injection attempt blocked: GET /api/users?id=1 OR 1=1" },
  { id: 5, timestamp: "2025-03-08 14:31:48.223", level: "WARN", source: "dns-resolver", message: "DNS query to known malicious domain: evil-c2.darknet.io" },
  { id: 6, timestamp: "2025-03-08 14:31:45.667", level: "INFO", source: "vpn-gateway", message: "New VPN tunnel established: user jdoe from 203.0.113.45" },
  { id: 7, timestamp: "2025-03-08 14:31:42.001", level: "DEBUG", source: "ntp-server", message: "Time sync completed, drift: +0.002s" },
  { id: 8, timestamp: "2025-03-08 14:31:38.889", level: "ERROR", source: "endpoint-agent", message: "Unauthorized process execution: powershell.exe -enc [BASE64]" },
  { id: 9, timestamp: "2025-03-08 14:31:35.112", level: "WARN", source: "dhcp-server", message: "DHCP lease conflict: 10.0.1.200 assigned to unknown MAC" },
  { id: 10, timestamp: "2025-03-08 14:31:30.556", level: "INFO", source: "backup-srv", message: "Incremental backup completed: 2.3GB, 0 errors" },
];

const levelColors: Record<string, string> = {
  ERROR: "text-destructive",
  WARN: "text-warning",
  INFO: "text-info",
  DEBUG: "text-muted-foreground",
};

export default function SecurityLogs() {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6 max-w-7xl">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Security Logs</h1>
        <p className="text-sm text-muted-foreground font-mono mt-1">Real-time log stream • Auto-refresh enabled</p>
      </div>

      <div className="rounded-lg border border-border bg-card overflow-hidden">
        <div className="bg-secondary/50 border-b border-border px-4 py-2 flex items-center gap-2">
          <FileText className="h-3.5 w-3.5 text-muted-foreground" />
          <span className="text-[10px] font-mono text-muted-foreground tracking-widest">LIVE LOG STREAM</span>
          <div className="ml-auto h-2 w-2 rounded-full bg-success animate-pulse" />
        </div>
        <div className="font-mono text-xs divide-y divide-border/50">
          {logs.map((log, i) => (
            <motion.div
              key={log.id}
              initial={{ opacity: 0, x: -5 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.04 }}
              className="px-4 py-2.5 hover:bg-secondary/30 transition-colors flex gap-3 items-start"
            >
              <span className="text-muted-foreground shrink-0 w-[180px]">{log.timestamp}</span>
              <span className={`shrink-0 w-12 font-bold ${levelColors[log.level]}`}>{log.level}</span>
              <span className="text-primary shrink-0 w-28 truncate">{log.source}</span>
              <span className="text-foreground/80 break-all">{log.message}</span>
            </motion.div>
          ))}
        </div>
      </div>
    </motion.div>
  );
}

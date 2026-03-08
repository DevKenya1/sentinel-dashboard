import { motion } from "framer-motion";
import { Wifi, WifiOff, Monitor, Server, Smartphone, Router } from "lucide-react";

const devices = [
  { id: 1, name: "Core-Router-01", type: "router", ip: "10.0.0.1", mac: "AA:BB:CC:DD:EE:01", status: "online", lastSeen: "Now", os: "Cisco IOS 15.7", risk: "low" },
  { id: 2, name: "Web-Server-Prod", type: "server", ip: "10.0.0.5", mac: "AA:BB:CC:DD:EE:05", status: "online", lastSeen: "Now", os: "Ubuntu 22.04", risk: "medium" },
  { id: 3, name: "DB-Server-01", type: "server", ip: "10.0.0.10", mac: "AA:BB:CC:DD:EE:10", status: "online", lastSeen: "Now", os: "CentOS 8", risk: "low" },
  { id: 4, name: "Unknown-Device", type: "unknown", ip: "10.0.1.200", mac: "FF:GG:HH:II:JJ:99", status: "online", lastSeen: "2 min ago", os: "Unknown", risk: "high" },
  { id: 5, name: "Dev-Workstation-12", type: "workstation", ip: "10.0.0.112", mac: "AA:BB:CC:DD:EE:12", status: "offline", lastSeen: "3h ago", os: "Windows 11", risk: "low" },
  { id: 6, name: "IoT-Camera-03", type: "iot", ip: "10.0.2.33", mac: "CC:DD:EE:FF:00:33", status: "online", lastSeen: "Now", os: "Embedded Linux", risk: "high" },
  { id: 7, name: "Switch-Floor-2", type: "router", ip: "10.0.0.2", mac: "AA:BB:CC:DD:EE:02", status: "online", lastSeen: "Now", os: "Cisco IOS 15.5", risk: "low" },
  { id: 8, name: "Mobile-BYOD-07", type: "mobile", ip: "10.0.3.77", mac: "DD:EE:FF:00:11:77", status: "online", lastSeen: "1 min ago", os: "Android 14", risk: "medium" },
];

const typeIcons: Record<string, React.ReactNode> = {
  router: <Router className="h-4 w-4" />,
  server: <Server className="h-4 w-4" />,
  workstation: <Monitor className="h-4 w-4" />,
  mobile: <Smartphone className="h-4 w-4" />,
  iot: <Wifi className="h-4 w-4" />,
  unknown: <WifiOff className="h-4 w-4" />,
};

const riskColors: Record<string, string> = {
  low: "text-success",
  medium: "text-warning",
  high: "text-destructive",
};

export default function NetworkDevices() {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6 max-w-7xl">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Network Devices</h1>
        <p className="text-sm text-muted-foreground font-mono mt-1">
          {devices.length} devices discovered • {devices.filter(d => d.status === "online").length} online
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {devices.map((device, i) => (
          <motion.div
            key={device.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.06 }}
            className={`rounded-lg border bg-card p-4 transition-all hover:border-primary/30 ${
              device.risk === "high" ? "border-destructive/30" : "border-border"
            }`}
          >
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="rounded-md bg-secondary p-2 text-muted-foreground">
                  {typeIcons[device.type] || typeIcons.unknown}
                </div>
                <div>
                  <p className="text-sm font-semibold">{device.name}</p>
                  <p className="text-[10px] font-mono text-muted-foreground">{device.type.toUpperCase()}</p>
                </div>
              </div>
              <div className="flex items-center gap-1.5">
                <div className={`h-2 w-2 rounded-full ${device.status === "online" ? "bg-success" : "bg-muted-foreground"}`} />
                <span className="text-[10px] font-mono text-muted-foreground">{device.status}</span>
              </div>
            </div>
            <div className="space-y-1.5 text-xs font-mono">
              <div className="flex justify-between">
                <span className="text-muted-foreground">IP</span>
                <span className="text-foreground">{device.ip}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">MAC</span>
                <span className="text-foreground">{device.mac}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">OS</span>
                <span className="text-foreground">{device.os}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Risk</span>
                <span className={`font-bold uppercase ${riskColors[device.risk]}`}>{device.risk}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Last seen</span>
                <span className="text-foreground">{device.lastSeen}</span>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}

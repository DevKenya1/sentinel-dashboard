import { motion } from "framer-motion";
import { Wifi, WifiOff, Monitor, Server, Smartphone, Router } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

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
  const { data: devices = [] } = useQuery({
    queryKey: ["network-devices"],
    queryFn: async () => {
      const { data } = await supabase.from("network_devices").select("*").order("last_seen", { ascending: false });
      return data ?? [];
    },
  });

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
              device.risk_level === "high" ? "border-destructive/30" : "border-border"
            }`}
          >
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="rounded-md bg-secondary p-2 text-muted-foreground">
                  {typeIcons[device.device_type] || typeIcons.unknown}
                </div>
                <div>
                  <p className="text-sm font-semibold">{device.name}</p>
                  <p className="text-[10px] font-mono text-muted-foreground">{device.device_type.toUpperCase()}</p>
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
                <span className="text-foreground">{device.ip_address}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">MAC</span>
                <span className="text-foreground">{device.mac_address}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">OS</span>
                <span className="text-foreground">{device.os || "Unknown"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Risk</span>
                <span className={`font-bold uppercase ${riskColors[device.risk_level]}`}>{device.risk_level}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Last seen</span>
                <span className="text-foreground">{new Date(device.last_seen).toLocaleTimeString()}</span>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}

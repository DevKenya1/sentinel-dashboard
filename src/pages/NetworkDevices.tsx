import { motion } from "framer-motion";
import { Wifi, WifiOff, Monitor, Server, Smartphone, Router, Radar, Loader2, Globe } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useState } from "react";
import { toast } from "sonner";

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

const portServiceMap: Record<number, string> = {
  21: "FTP", 22: "SSH", 23: "Telnet", 25: "SMTP", 53: "DNS", 80: "HTTP",
  135: "RPC", 139: "NetBIOS", 161: "SNMP", 443: "HTTPS", 445: "SMB",
  554: "RTSP", 587: "SMTPS", 993: "IMAPS", 1337: "waste", 1883: "MQTT",
  3306: "MySQL", 3389: "RDP", 4444: "Backdoor", 5432: "PostgreSQL",
  5683: "CoAP", 5900: "VNC", 8080: "HTTP-Alt", 8443: "HTTPS-Alt",
  62078: "iPhone",
};

export default function NetworkDevices() {
  const queryClient = useQueryClient();
  const [subnet, setSubnet] = useState("10.0.0.0/24");

  const { data: devices = [] } = useQuery({
    queryKey: ["network-devices"],
    queryFn: async () => {
      const { data } = await supabase.from("network_devices").select("*").order("last_seen", { ascending: false });
      return data ?? [];
    },
  });

  const { data: scanHistory = [] } = useQuery({
    queryKey: ["scan-history"],
    queryFn: async () => {
      const { data } = await supabase.from("scan_history").select("*").order("created_at", { ascending: false }).limit(5);
      return data ?? [];
    },
  });

  const scanMutation = useMutation({
    mutationFn: async (scanSubnet: string) => {
      const { data, error } = await supabase.functions.invoke("scan-network", {
        body: { subnet: scanSubnet, count: 6 + Math.floor(Math.random() * 6) },
      });
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      toast.success(`Scan complete: ${data.scan.devices_found} devices found in ${data.scan.duration_ms}ms`);
      queryClient.invalidateQueries({ queryKey: ["network-devices"] });
      queryClient.invalidateQueries({ queryKey: ["scan-history"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-stats"] });
    },
    onError: (err: any) => {
      toast.error(`Scan failed: ${err.message}`);
    },
  });

  const onlineCount = devices.filter(d => d.status === "online").length;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6 max-w-7xl">
      {/* Header with Scan Controls */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Network Devices</h1>
          <p className="text-sm text-muted-foreground font-mono mt-1">
            {devices.length} devices discovered • {onlineCount} online
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2 rounded-lg border border-border bg-secondary px-3 py-1.5">
            <Globe className="h-3.5 w-3.5 text-muted-foreground" />
            <input
              type="text"
              value={subnet}
              onChange={(e) => setSubnet(e.target.value)}
              className="bg-transparent text-xs font-mono text-foreground outline-none w-32"
              placeholder="10.0.0.0/24"
            />
          </div>
          <button
            onClick={() => scanMutation.mutate(subnet)}
            disabled={scanMutation.isPending}
            className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            {scanMutation.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Radar className="h-4 w-4" />
            )}
            {scanMutation.isPending ? "Scanning..." : "Scan Network"}
          </button>
        </div>
      </div>

      {/* Scan Animation */}
      {scanMutation.isPending && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          exit={{ opacity: 0, height: 0 }}
          className="rounded-lg border border-primary/30 bg-primary/5 p-4 glow-primary"
        >
          <div className="flex items-center gap-3">
            <div className="relative">
              <Radar className="h-6 w-6 text-primary animate-pulse" />
              <div className="absolute inset-0 h-6 w-6 rounded-full border border-primary/30 animate-ping" />
            </div>
            <div>
              <p className="text-sm font-semibold text-primary">Network Scan in Progress</p>
              <p className="text-[10px] font-mono text-muted-foreground">
                Scanning {subnet} • Discovering hosts, detecting ports, fingerprinting OS...
              </p>
            </div>
          </div>
          <div className="mt-3 h-1 rounded-full bg-secondary overflow-hidden">
            <motion.div
              className="h-full bg-primary rounded-full"
              initial={{ width: "0%" }}
              animate={{ width: "100%" }}
              transition={{ duration: 2, ease: "easeInOut" }}
            />
          </div>
        </motion.div>
      )}

      {/* Recent Scan History */}
      {scanHistory.length > 0 && (
        <div className="flex items-center gap-3 overflow-x-auto pb-1">
          <span className="text-[10px] font-mono text-muted-foreground whitespace-nowrap">RECENT SCANS:</span>
          {scanHistory.map((scan) => (
            <div key={scan.id} className="flex items-center gap-2 rounded border border-border bg-card px-3 py-1.5 text-[10px] font-mono whitespace-nowrap">
              <span className="text-muted-foreground">{scan.subnet}</span>
              <span className="text-foreground">{scan.devices_found} devices</span>
              <span className="text-muted-foreground">{scan.duration_ms}ms</span>
              <span className="text-success">✓</span>
            </div>
          ))}
        </div>
      )}

      {/* Device Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {devices.map((device, i) => (
          <motion.div
            key={device.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.04 }}
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
                <span className="text-primary">{device.ip_address}</span>
              </div>
              {device.hostname && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Hostname</span>
                  <span className="text-foreground">{device.hostname}</span>
                </div>
              )}
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

            {/* Open Ports Section */}
            {device.open_ports && device.open_ports.length > 0 && (
              <div className="mt-3 pt-3 border-t border-border">
                <p className="text-[10px] font-mono text-muted-foreground uppercase tracking-widest mb-2">Open Ports</p>
                <div className="flex flex-wrap gap-1">
                  {device.open_ports.map((port: number) => (
                    <span
                      key={port}
                      className={`inline-flex items-center rounded px-1.5 py-0.5 text-[10px] font-mono border ${
                        [23, 21, 4444, 1337].includes(port)
                          ? "bg-destructive/10 text-destructive border-destructive/30"
                          : "bg-secondary text-secondary-foreground border-border"
                      }`}
                      title={portServiceMap[port] || `Port ${port}`}
                    >
                      {port}
                      {portServiceMap[port] && (
                        <span className="ml-1 text-muted-foreground">/{portServiceMap[port]}</span>
                      )}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}

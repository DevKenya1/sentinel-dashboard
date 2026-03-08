import { motion, AnimatePresence } from "framer-motion";
import { Globe, X } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useState, useMemo } from "react";
import {
  ComposableMap,
  Geographies,
  Geography,
  Marker,
  ZoomableGroup,
} from "react-simple-maps";

const GEO_URL = "https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json";

// Deterministic geo coords from IP hash — simulated mapping
function ipToCoords(ip: string): [number, number] {
  let h = 0;
  for (let i = 0; i < ip.length; i++) h = (h * 31 + ip.charCodeAt(i)) | 0;
  const regions: [number, number][] = [
    [55.7, 37.6], // Moscow
    [39.9, 116.4], // Beijing
    [35.7, 51.4], // Tehran
    [28.6, 77.2], // Delhi
    [37.6, 127.0], // Seoul
    [-23.5, -46.6], // São Paulo
    [14.6, 121.0], // Manila
    [6.5, 3.4], // Lagos
    [41.0, 29.0], // Istanbul
    [33.9, 35.5], // Beirut
    [51.5, -0.1], // London
    [48.9, 2.3], // Paris
    [40.4, -3.7], // Madrid
    [52.5, 13.4], // Berlin
    [-33.9, 18.4], // Cape Town
    [1.3, 103.8], // Singapore
    [25.3, 55.3], // Dubai
    [35.0, 135.8], // Kyoto
    [-34.6, -58.4], // Buenos Aires
    [19.4, -99.1], // Mexico City
  ];
  const idx = Math.abs(h) % regions.length;
  const jitter = ((h >> 8) % 50) / 10;
  return [regions[idx][0] + jitter, regions[idx][1] - jitter];
}

const severityColor: Record<string, string> = {
  critical: "hsl(var(--destructive))",
  high: "hsl(var(--warning))",
  medium: "hsl(var(--info))",
  low: "hsl(var(--muted-foreground))",
};

const severityBorder: Record<string, string> = {
  critical: "border-destructive/40",
  high: "border-warning/40",
  medium: "border-info/40",
  low: "border-border",
};

const severityBg: Record<string, string> = {
  critical: "bg-destructive/20 text-destructive",
  high: "bg-warning/20 text-warning",
  medium: "bg-info/20 text-info",
  low: "bg-muted text-muted-foreground",
};

type AlertRow = {
  id: string;
  source_ip: string;
  severity: string;
  type: string;
  message: string;
  target: string;
  status: string;
  created_at: string;
};

type AttackNode = {
  ip: string;
  coords: [number, number];
  count: number;
  maxSeverity: string;
  alerts: AlertRow[];
};

const severityRank: Record<string, number> = { critical: 4, high: 3, medium: 2, low: 1 };

export default function AttackMap() {
  const [selected, setSelected] = useState<AttackNode | null>(null);

  const { data: alerts = [] } = useQuery<AlertRow[]>({
    queryKey: ["alerts-map"],
    queryFn: async () => {
      const { data } = await supabase
        .from("security_alerts")
        .select("*")
        .order("created_at", { ascending: false });
      return (data ?? []) as AlertRow[];
    },
  });

  const nodes = useMemo(() => {
    const map = new Map<string, AttackNode>();
    for (const a of alerts) {
      const existing = map.get(a.source_ip);
      if (existing) {
        existing.count++;
        existing.alerts.push(a);
        if ((severityRank[a.severity] ?? 0) > (severityRank[existing.maxSeverity] ?? 0)) {
          existing.maxSeverity = a.severity;
        }
      } else {
        const coords = ipToCoords(a.source_ip);
        map.set(a.source_ip, { ip: a.source_ip, coords, count: 1, maxSeverity: a.severity, alerts: [a] });
      }
    }
    return Array.from(map.values());
  }, [alerts]);

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6 max-w-7xl">
      <div>
        <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
          <Globe className="h-6 w-6 text-primary" /> Attack Map
        </h1>
        <p className="text-sm text-muted-foreground font-mono mt-1">
          {nodes.length} unique source IPs • {alerts.length} total alerts
        </p>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
        {["critical", "high", "medium", "low"].map((s) => (
          <div key={s} className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full" style={{ background: severityColor[s] }} />
            {s}
          </div>
        ))}
        <span className="ml-2">● size = frequency</span>
      </div>

      {/* Map */}
      <div className="rounded-lg border border-border bg-card overflow-hidden relative" style={{ aspectRatio: "2/1" }}>
        <ComposableMap
          projectionConfig={{ scale: 147, center: [10, 10] }}
          style={{ width: "100%", height: "100%" }}
        >
          <ZoomableGroup>
            <Geographies geography={GEO_URL}>
              {({ geographies }) =>
                geographies.map((geo) => (
                  <Geography
                    key={geo.rsmKey}
                    geography={geo}
                    fill="hsl(var(--muted))"
                    stroke="hsl(var(--border))"
                    strokeWidth={0.5}
                    style={{
                      default: { outline: "none" },
                      hover: { fill: "hsl(var(--accent))", outline: "none" },
                      pressed: { outline: "none" },
                    }}
                  />
                ))
              }
            </Geographies>
            {nodes.map((node) => {
              const r = Math.min(3 + node.count * 1.5, 12);
              return (
                <Marker
                  key={node.ip}
                  coordinates={[node.coords[1], node.coords[0]]}
                  onClick={() => setSelected(node)}
                  style={{ cursor: "pointer" }}
                >
                  <circle
                    r={r}
                    fill={severityColor[node.maxSeverity] || severityColor.low}
                    fillOpacity={0.7}
                    stroke={severityColor[node.maxSeverity] || severityColor.low}
                    strokeWidth={1.5}
                    strokeOpacity={0.3}
                  />
                  <circle r={r + 4} fill={severityColor[node.maxSeverity] || severityColor.low} fillOpacity={0.15} />
                </Marker>
              );
            })}
          </ZoomableGroup>
        </ComposableMap>

        {/* Click-to-view panel */}
        <AnimatePresence>
          {selected && (
            <motion.div
              initial={{ x: 20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: 20, opacity: 0 }}
              className={`absolute top-4 right-4 w-80 max-h-[calc(100%-2rem)] overflow-y-auto rounded-lg border bg-card/95 backdrop-blur-sm p-4 shadow-xl ${severityBorder[selected.maxSeverity]}`}
            >
              <div className="flex items-center justify-between mb-3">
                <div>
                  <p className="font-mono text-sm font-bold text-foreground">{selected.ip}</p>
                  <p className="text-[10px] font-mono text-muted-foreground">{selected.count} alert{selected.count > 1 ? "s" : ""}</p>
                </div>
                <button onClick={() => setSelected(null)} className="p-1 rounded hover:bg-muted"><X className="h-4 w-4 text-muted-foreground" /></button>
              </div>

              <div className="space-y-2">
                {selected.alerts.map((a) => (
                  <div key={a.id} className="p-2.5 rounded-lg bg-muted/50 border border-border text-xs">
                    <div className="flex items-center justify-between mb-1">
                      <span className={`px-1.5 py-0.5 rounded text-[10px] font-mono font-bold uppercase ${severityBg[a.severity]}`}>
                        {a.severity}
                      </span>
                      <span className="text-[10px] font-mono text-muted-foreground">
                        {new Date(a.created_at).toLocaleString()}
                      </span>
                    </div>
                    <p className="font-mono text-foreground">{a.type}</p>
                    <p className="text-muted-foreground mt-0.5">{a.message}</p>
                    <p className="text-[10px] text-muted-foreground mt-1">Target: {a.target}</p>
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* IP Summary Table */}
      <div className="rounded-lg border border-border bg-card overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/50">
              <th className="text-left p-3 text-[10px] font-mono uppercase tracking-widest text-muted-foreground">Source IP</th>
              <th className="text-left p-3 text-[10px] font-mono uppercase tracking-widest text-muted-foreground">Alerts</th>
              <th className="text-left p-3 text-[10px] font-mono uppercase tracking-widest text-muted-foreground">Max Severity</th>
              <th className="text-left p-3 text-[10px] font-mono uppercase tracking-widest text-muted-foreground">Types</th>
            </tr>
          </thead>
          <tbody>
            {nodes
              .sort((a, b) => (severityRank[b.maxSeverity] ?? 0) - (severityRank[a.maxSeverity] ?? 0) || b.count - a.count)
              .map((n) => (
                <tr
                  key={n.ip}
                  onClick={() => setSelected(n)}
                  className="border-b border-border hover:bg-muted/30 cursor-pointer transition-colors"
                >
                  <td className="p-3 font-mono text-xs text-primary">{n.ip}</td>
                  <td className="p-3 font-mono text-xs font-bold text-foreground">{n.count}</td>
                  <td className="p-3">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase ${severityBg[n.maxSeverity]}`}>
                      {n.maxSeverity}
                    </span>
                  </td>
                  <td className="p-3 text-xs text-muted-foreground font-mono">
                    {[...new Set(n.alerts.map((a) => a.type))].join(", ")}
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>
    </motion.div>
  );
}

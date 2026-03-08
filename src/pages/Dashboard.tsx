import { Bug, Server, AlertTriangle, Activity, Shield, Clock } from "lucide-react";
import { StatCard } from "@/components/StatCard";
import { HealthGauge } from "@/components/HealthGauge";
import { motion } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useTimeSeriesData } from "@/hooks/useTimeSeriesData";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, PieChart, Pie, Cell, Legend,
} from "recharts";

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.07 } },
};
const item = {
  hidden: { opacity: 0, y: 14 },
  show: { opacity: 1, y: 0, transition: { duration: 0.45 } },
};

const CHART_COLORS = {
  primary: "hsl(175, 80%, 50%)",
  primaryDim: "hsl(175, 80%, 50%, 0.15)",
  destructive: "hsl(0, 72%, 55%)",
  destructiveDim: "hsl(0, 72%, 55%, 0.15)",
  warning: "hsl(38, 92%, 50%)",
  info: "hsl(200, 80%, 55%)",
  success: "hsl(145, 70%, 45%)",
  muted: "hsl(220, 14%, 18%)",
  foreground: "hsl(210, 20%, 92%)",
  mutedFg: "hsl(215, 12%, 52%)",
};

const PIE_COLORS = [CHART_COLORS.destructive, CHART_COLORS.warning, CHART_COLORS.info, CHART_COLORS.primary, CHART_COLORS.success, CHART_COLORS.mutedFg];

const severityColors: Record<string, string> = {
  critical: "bg-destructive/20 text-destructive border-destructive/30",
  high: "bg-warning/20 text-warning border-warning/30",
  medium: "bg-info/20 text-info border-info/30",
  low: "bg-muted text-muted-foreground border-border",
};

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-border bg-card px-3 py-2 shadow-lg">
      <p className="text-[10px] font-mono text-muted-foreground mb-1">{label}</p>
      {payload.map((p: any) => (
        <p key={p.dataKey} className="text-xs font-mono" style={{ color: p.color }}>
          {p.name}: {p.value}
        </p>
      ))}
    </div>
  );
};

export default function Dashboard() {
  const timeSeries = useTimeSeriesData(24);

  const { data: alerts = [] } = useQuery({
    queryKey: ["dashboard-alerts"],
    queryFn: async () => {
      const { data } = await supabase.from("security_alerts").select("*").order("created_at", { ascending: false }).limit(8);
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
      const onlineDevices = allDevices.filter(d => d.status === "online").length;
      const resolvedAlerts = allAlerts.filter(a => a.status === "resolved").length;
      const healthScore = allAlerts.length > 0
        ? Math.round(100 - (allAlerts.filter(a => a.severity === "critical").length / allAlerts.length) * 60 - (allAlerts.filter(a => a.status === "active").length / allAlerts.length) * 20)
        : 95;
      return {
        threats: allAlerts.length,
        devices: allDevices.length,
        activeAlerts: allAlerts.filter(a => a.status === "active").length,
        criticalCount: allAlerts.filter(a => a.severity === "critical").length,
        healthScore: Math.max(healthScore, 10),
        onlineDevices,
      };
    },
  });

  const { data: attackDistribution = [] } = useQuery({
    queryKey: ["dashboard-attack-distribution"],
    queryFn: async () => {
      const { data } = await supabase.from("security_alerts").select("type");
      if (!data) return [];
      const counts: Record<string, number> = {};
      data.forEach(a => { counts[a.type] = (counts[a.type] || 0) + 1; });
      return Object.entries(counts)
        .map(([name, value]) => ({ name, value }))
        .sort((a, b) => b.value - a.value);
    },
  });

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-6 max-w-[1400px]">
      {/* Header */}
      <motion.div variants={item} className="flex items-end justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Security Operations Center</h1>
          <p className="text-sm text-muted-foreground font-mono mt-1">
            Real-time threat monitoring & network intelligence
          </p>
        </div>
        <div className="hidden sm:flex items-center gap-2 text-[10px] font-mono text-muted-foreground">
          <Clock className="h-3 w-3" />
          Last updated: {new Date().toLocaleTimeString()}
        </div>
      </motion.div>

      {/* Top Stat Cards */}
      <motion.div variants={item} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Threats Detected"
          value={stats?.threats ?? 0}
          subtitle={`${stats?.criticalCount ?? 0} critical severity`}
          icon={<Bug className="h-5 w-5" />}
          trend={`↑ ${stats?.criticalCount ?? 0} critical`}
          trendUp
          variant="danger"
        />
        <StatCard
          title="Devices Discovered"
          value={stats?.devices ?? 0}
          subtitle={`${stats?.onlineDevices ?? 0} currently online`}
          icon={<Server className="h-5 w-5" />}
          variant="success"
        />
        <StatCard
          title="Active Alerts"
          value={stats?.activeAlerts ?? 0}
          subtitle="Requires investigation"
          icon={<AlertTriangle className="h-5 w-5" />}
          trend={stats?.activeAlerts && stats.activeAlerts > 3 ? "↑ Above threshold" : undefined}
          trendUp={true}
          variant="warning"
        />
        <StatCard
          title="Network Health"
          value={`${stats?.healthScore ?? 0}%`}
          subtitle={stats?.healthScore && stats.healthScore >= 80 ? "Systems nominal" : "Degraded performance"}
          icon={<Activity className="h-5 w-5" />}
          variant={stats?.healthScore && stats.healthScore >= 80 ? "success" : stats?.healthScore && stats.healthScore >= 50 ? "warning" : "danger"}
        />
      </motion.div>

      {/* Charts Row 1: Threats Over Time + Network Health Gauge */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <motion.div variants={item} className="lg:col-span-3 rounded-lg border border-border bg-card">
          <div className="border-b border-border px-5 py-3 flex items-center justify-between">
            <h2 className="text-sm font-semibold">Threats Detected Over Time</h2>
            <span className="text-[10px] font-mono text-muted-foreground">LAST 24 HOURS</span>
          </div>
          <div className="p-4 h-[260px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={timeSeries}>
                <defs>
                  <linearGradient id="threatGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={CHART_COLORS.destructive} stopOpacity={0.3} />
                    <stop offset="100%" stopColor={CHART_COLORS.destructive} stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="blockedGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={CHART_COLORS.primary} stopOpacity={0.3} />
                    <stop offset="100%" stopColor={CHART_COLORS.primary} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke={CHART_COLORS.muted} />
                <XAxis dataKey="label" tick={{ fontSize: 10, fontFamily: "JetBrains Mono", fill: CHART_COLORS.mutedFg }} tickLine={false} axisLine={{ stroke: CHART_COLORS.muted }} />
                <YAxis tick={{ fontSize: 10, fontFamily: "JetBrains Mono", fill: CHART_COLORS.mutedFg }} tickLine={false} axisLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Area type="monotone" dataKey="threats" name="Threats" stroke={CHART_COLORS.destructive} fill="url(#threatGradient)" strokeWidth={2} />
                <Area type="monotone" dataKey="blocked" name="Blocked" stroke={CHART_COLORS.primary} fill="url(#blockedGradient)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        <motion.div variants={item} className="rounded-lg border border-border bg-card flex flex-col items-center justify-center p-6">
          <h2 className="text-sm font-semibold mb-4">Network Health</h2>
          <HealthGauge score={stats?.healthScore ?? 0} />
          <div className="mt-4 space-y-1 w-full">
            <div className="flex justify-between text-[10px] font-mono">
              <span className="text-muted-foreground">Online devices</span>
              <span className="text-foreground">{stats?.onlineDevices ?? 0}/{stats?.devices ?? 0}</span>
            </div>
            <div className="flex justify-between text-[10px] font-mono">
              <span className="text-muted-foreground">Active threats</span>
              <span className="text-destructive">{stats?.activeAlerts ?? 0}</span>
            </div>
            <div className="flex justify-between text-[10px] font-mono">
              <span className="text-muted-foreground">Critical</span>
              <span className="text-destructive">{stats?.criticalCount ?? 0}</span>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Charts Row 2: Network Activity + Attack Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <motion.div variants={item} className="lg:col-span-2 rounded-lg border border-border bg-card">
          <div className="border-b border-border px-5 py-3 flex items-center justify-between">
            <h2 className="text-sm font-semibold">Network Activity</h2>
            <div className="flex items-center gap-3 text-[10px] font-mono">
              <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full" style={{ background: CHART_COLORS.primary }} /> Traffic</span>
              <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full" style={{ background: CHART_COLORS.warning }} /> Anomalies</span>
            </div>
          </div>
          <div className="p-4 h-[240px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={timeSeries} barGap={1}>
                <CartesianGrid strokeDasharray="3 3" stroke={CHART_COLORS.muted} />
                <XAxis dataKey="label" tick={{ fontSize: 10, fontFamily: "JetBrains Mono", fill: CHART_COLORS.mutedFg }} tickLine={false} axisLine={{ stroke: CHART_COLORS.muted }} />
                <YAxis tick={{ fontSize: 10, fontFamily: "JetBrains Mono", fill: CHART_COLORS.mutedFg }} tickLine={false} axisLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="traffic" name="Traffic" fill={CHART_COLORS.primary} radius={[2, 2, 0, 0]} opacity={0.7} />
                <Bar dataKey="threats" name="Anomalies" fill={CHART_COLORS.warning} radius={[2, 2, 0, 0]} opacity={0.8} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        <motion.div variants={item} className="rounded-lg border border-border bg-card">
          <div className="border-b border-border px-5 py-3">
            <h2 className="text-sm font-semibold">Attack Type Distribution</h2>
          </div>
          <div className="p-4 h-[240px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={attackDistribution}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={75}
                  paddingAngle={3}
                  dataKey="value"
                  strokeWidth={0}
                >
                  {attackDistribution.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
                <Legend
                  iconType="circle"
                  iconSize={6}
                  formatter={(value) => <span className="text-[10px] font-mono text-muted-foreground">{value}</span>}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </motion.div>
      </div>

      {/* Recent Alerts Table */}
      <motion.div variants={item} className="rounded-lg border border-border bg-card overflow-hidden">
        <div className="flex items-center justify-between border-b border-border px-5 py-3">
          <div className="flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-destructive animate-pulse" />
            <h2 className="text-sm font-semibold">Recent Security Alerts</h2>
          </div>
          <span className="text-[10px] font-mono text-muted-foreground">{alerts.length} LATEST</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-secondary/30">
                <th className="px-4 py-2.5 text-left text-[10px] font-mono uppercase tracking-widest text-muted-foreground">Timestamp</th>
                <th className="px-4 py-2.5 text-left text-[10px] font-mono uppercase tracking-widest text-muted-foreground">Source IP</th>
                <th className="px-4 py-2.5 text-left text-[10px] font-mono uppercase tracking-widest text-muted-foreground">Threat Type</th>
                <th className="px-4 py-2.5 text-left text-[10px] font-mono uppercase tracking-widest text-muted-foreground">Severity</th>
                <th className="px-4 py-2.5 text-left text-[10px] font-mono uppercase tracking-widest text-muted-foreground hidden md:table-cell">Status</th>
                <th className="px-4 py-2.5 text-left text-[10px] font-mono uppercase tracking-widest text-muted-foreground hidden lg:table-cell">Message</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/50">
              {alerts.map((alert, i) => (
                <motion.tr
                  key={alert.id}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.4 + i * 0.05 }}
                  className="hover:bg-secondary/30 transition-colors"
                >
                  <td className="px-4 py-2.5 text-xs font-mono text-muted-foreground whitespace-nowrap">
                    {new Date(alert.created_at).toLocaleString()}
                  </td>
                  <td className="px-4 py-2.5 text-xs font-mono text-primary">{alert.source_ip}</td>
                  <td className="px-4 py-2.5 text-xs font-mono text-foreground">{alert.type}</td>
                  <td className="px-4 py-2.5">
                    <span className={`inline-flex items-center rounded border px-1.5 py-0.5 text-[10px] font-mono font-bold uppercase ${severityColors[alert.severity]}`}>
                      {alert.severity}
                    </span>
                  </td>
                  <td className="px-4 py-2.5 hidden md:table-cell">
                    <span className={`text-xs font-mono capitalize ${
                      alert.status === "active" ? "text-destructive" :
                      alert.status === "investigating" ? "text-warning" : "text-success"
                    }`}>● {alert.status}</span>
                  </td>
                  <td className="px-4 py-2.5 text-xs text-muted-foreground max-w-xs truncate hidden lg:table-cell">
                    {alert.message}
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      </motion.div>
    </motion.div>
  );
}

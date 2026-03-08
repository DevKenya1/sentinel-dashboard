import { motion } from "framer-motion";
import { Brain, TrendingUp, Target, MapPin } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.1 } },
};
const item = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0 },
};

export default function ThreatAnalysis() {
  const { data: threats = [] } = useQuery({
    queryKey: ["threat-analysis"],
    queryFn: async () => {
      const { data } = await supabase.from("threat_analysis").select("*").order("confidence", { ascending: false });
      return data ?? [];
    },
  });

  const activeCount = threats.filter(t => t.status === "active").length;
  const avgConfidence = threats.length > 0 ? Math.round(threats.reduce((a, t) => a + t.confidence, 0) / threats.length) : 0;
  const totalIocs = threats.reduce((a, t) => a + (t.iocs?.length ?? 0), 0);

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-6 max-w-7xl">
      <motion.div variants={item}>
        <h1 className="text-2xl font-bold tracking-tight">Threat Analysis</h1>
        <p className="text-sm text-muted-foreground font-mono mt-1">AI-powered threat intelligence and correlation</p>
      </motion.div>

      <motion.div variants={item} className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="rounded-lg border border-border bg-card p-4 flex items-center gap-3">
          <div className="rounded-lg bg-destructive/10 p-2.5"><Target className="h-5 w-5 text-destructive" /></div>
          <div>
            <p className="text-2xl font-bold font-mono">{activeCount}</p>
            <p className="text-[10px] font-mono text-muted-foreground uppercase tracking-widest">Active Threat Groups</p>
          </div>
        </div>
        <div className="rounded-lg border border-border bg-card p-4 flex items-center gap-3">
          <div className="rounded-lg bg-primary/10 p-2.5"><Brain className="h-5 w-5 text-primary" /></div>
          <div>
            <p className="text-2xl font-bold font-mono">{avgConfidence}%</p>
            <p className="text-[10px] font-mono text-muted-foreground uppercase tracking-widest">Avg Confidence</p>
          </div>
        </div>
        <div className="rounded-lg border border-border bg-card p-4 flex items-center gap-3">
          <div className="rounded-lg bg-warning/10 p-2.5"><TrendingUp className="h-5 w-5 text-warning" /></div>
          <div>
            <p className="text-2xl font-bold font-mono">{totalIocs}</p>
            <p className="text-[10px] font-mono text-muted-foreground uppercase tracking-widest">IOCs Detected</p>
          </div>
        </div>
      </motion.div>

      {threats.map((threat) => (
        <motion.div
          key={threat.id}
          variants={item}
          className={`rounded-lg border bg-card p-6 ${threat.status === "active" ? "border-destructive/30" : "border-border"}`}
        >
          <div className="flex items-start justify-between mb-4">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold">{threat.name}</h2>
                <span className={`text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded border ${
                  threat.status === "active" ? "bg-destructive/20 text-destructive border-destructive/30" : "bg-warning/20 text-warning border-warning/30"
                }`}>{threat.status}</span>
              </div>
              <p className="text-sm text-muted-foreground mt-1">{threat.description}</p>
            </div>
            <div className="text-right">
              <p className="text-3xl font-bold font-mono text-primary">{threat.confidence}%</p>
              <p className="text-[10px] font-mono text-muted-foreground">CONFIDENCE</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
            <div>
              <p className="text-[10px] font-mono text-muted-foreground uppercase tracking-widest mb-2">Type & Origin</p>
              <div className="flex items-center gap-2 text-foreground font-mono text-xs">
                <MapPin className="h-3 w-3 text-muted-foreground" />
                {threat.threat_type} • {threat.origin}
              </div>
            </div>
            <div>
              <p className="text-[10px] font-mono text-muted-foreground uppercase tracking-widest mb-2">TTPs</p>
              <div className="flex flex-wrap gap-1">
                {(threat.ttps ?? []).map(ttp => (
                  <span key={ttp} className="px-2 py-0.5 rounded bg-secondary text-[10px] font-mono text-secondary-foreground">{ttp}</span>
                ))}
              </div>
            </div>
            <div>
              <p className="text-[10px] font-mono text-muted-foreground uppercase tracking-widest mb-2">IOCs</p>
              <div className="space-y-0.5">
                {(threat.iocs ?? []).map(ioc => (
                  <p key={ioc} className="text-xs font-mono text-primary">{ioc}</p>
                ))}
              </div>
            </div>
          </div>
        </motion.div>
      ))}
    </motion.div>
  );
}

import { motion } from "framer-motion";
import { Brain, TrendingUp, Target, MapPin, Zap, Shield, Loader2, AlertTriangle } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useState } from "react";
import { toast } from "sonner";

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.1 } },
};
const item = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0 },
};

const severityColors: Record<string, string> = {
  critical: "bg-destructive/20 text-destructive border-destructive/30",
  high: "bg-destructive/10 text-destructive border-destructive/20",
  medium: "bg-warning/20 text-warning border-warning/30",
  low: "bg-info/10 text-info border-info/30",
};

type AIAnalysis = {
  threat_type: string;
  severity: string;
  explanation: string;
  mitigation: string[];
};

type AnalysisResult = {
  logId: string;
  logMessage: string;
  analysis: AIAnalysis;
  timestamp: string;
};

export default function ThreatAnalysis() {
  const queryClient = useQueryClient();
  const [analyses, setAnalyses] = useState<AnalysisResult[]>([]);
  const [analyzingId, setAnalyzingId] = useState<string | null>(null);

  const { data: threats = [] } = useQuery({
    queryKey: ["threat-analysis"],
    queryFn: async () => {
      const { data } = await supabase.from("threat_analysis").select("*").order("confidence", { ascending: false });
      return data ?? [];
    },
  });

  const { data: suspiciousLogs = [] } = useQuery({
    queryKey: ["suspicious-logs-for-analysis"],
    queryFn: async () => {
      const { data } = await supabase
        .from("security_logs")
        .select("*")
        .eq("is_suspicious", true)
        .order("created_at", { ascending: false })
        .limit(20);
      return data ?? [];
    },
  });

  const analyzeMutation = useMutation({
    mutationFn: async (log: any) => {
      setAnalyzingId(log.id);
      const { data, error } = await supabase.functions.invoke("analyze-threat", {
        body: { log },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      return { logId: log.id, logMessage: log.message, analysis: data as AIAnalysis, timestamp: new Date().toISOString() };
    },
    onSuccess: (result) => {
      setAnalyses((prev) => [result, ...prev]);
      setAnalyzingId(null);
      toast.success("Threat analyzed successfully");
    },
    onError: (err: any) => {
      setAnalyzingId(null);
      toast.error(err.message || "Analysis failed");
    },
  });

  const analyzeAll = useMutation({
    mutationFn: async () => {
      const unanalyzed = suspiciousLogs.filter((l) => !analyses.some((a) => a.logId === l.id));
      for (const log of unanalyzed.slice(0, 5)) {
        setAnalyzingId(log.id);
        const { data, error } = await supabase.functions.invoke("analyze-threat", { body: { log } });
        if (error || data?.error) continue;
        setAnalyses((prev) => [
          { logId: log.id, logMessage: log.message, analysis: data as AIAnalysis, timestamp: new Date().toISOString() },
          ...prev,
        ]);
      }
      setAnalyzingId(null);
    },
    onSuccess: () => toast.success("Batch analysis complete"),
    onError: () => { setAnalyzingId(null); toast.error("Batch analysis failed"); },
  });

  const activeCount = threats.filter((t) => t.status === "active").length;
  const avgConfidence = threats.length > 0 ? Math.round(threats.reduce((a, t) => a + t.confidence, 0) / threats.length) : 0;
  const totalIocs = threats.reduce((a, t) => a + (t.iocs?.length ?? 0), 0);

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-6 max-w-7xl">
      <motion.div variants={item} className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Threat Analysis</h1>
          <p className="text-sm text-muted-foreground font-mono mt-1">AI-powered threat intelligence and correlation</p>
        </div>
        <button
          onClick={() => analyzeAll.mutate()}
          disabled={analyzeAll.isPending}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-mono font-bold hover:bg-primary/90 transition-colors disabled:opacity-50"
        >
          {analyzeAll.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Brain className="h-4 w-4" />}
          Analyze Suspicious Logs
        </button>
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
            <p className="text-2xl font-bold font-mono">{analyses.length}</p>
            <p className="text-[10px] font-mono text-muted-foreground uppercase tracking-widest">AI Analyses</p>
          </div>
        </div>
      </motion.div>

      {/* Suspicious Logs Awaiting Analysis */}
      {suspiciousLogs.length > 0 && (
        <motion.div variants={item} className="rounded-lg border border-border bg-card p-6">
          <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-warning" />
            Suspicious Logs ({suspiciousLogs.length})
          </h2>
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {suspiciousLogs.map((log) => {
              const alreadyAnalyzed = analyses.some((a) => a.logId === log.id);
              const isAnalyzing = analyzingId === log.id;
              return (
                <div key={log.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50 border border-border text-sm">
                  <div className="flex-1 min-w-0">
                    <p className="font-mono text-xs truncate text-foreground">{log.message}</p>
                    <p className="text-[10px] font-mono text-muted-foreground mt-0.5">
                      {log.source_ip} • {log.pattern_matched} • {new Date(log.created_at).toLocaleTimeString()}
                    </p>
                  </div>
                  <button
                    onClick={() => analyzeMutation.mutate(log)}
                    disabled={isAnalyzing || alreadyAnalyzed}
                    className={`ml-3 flex items-center gap-1.5 px-3 py-1.5 rounded text-[10px] font-mono font-bold uppercase tracking-wider transition-colors ${
                      alreadyAnalyzed
                        ? "bg-accent text-accent-foreground opacity-50 cursor-default"
                        : "bg-primary/10 text-primary hover:bg-primary/20"
                    }`}
                  >
                    {isAnalyzing ? <Loader2 className="h-3 w-3 animate-spin" /> : <Zap className="h-3 w-3" />}
                    {alreadyAnalyzed ? "Done" : "Analyze"}
                  </button>
                </div>
              );
            })}
          </div>
        </motion.div>
      )}

      {/* AI Analysis Results */}
      {analyses.length > 0 && (
        <motion.div variants={item}>
          <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
            <Brain className="h-5 w-5 text-primary" />
            AI Analysis Results
          </h2>
          <div className="space-y-4">
            {analyses.map((result, i) => (
              <motion.div
                key={`${result.logId}-${i}`}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                className="rounded-lg border border-primary/20 bg-card p-6"
              >
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-base font-bold font-mono capitalize">
                        {result.analysis.threat_type.replace(/_/g, " ")}
                      </h3>
                      <span className={`text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded border ${severityColors[result.analysis.severity] || severityColors.medium}`}>
                        {result.analysis.severity}
                      </span>
                    </div>
                    <p className="text-xs font-mono text-muted-foreground mt-1 truncate max-w-lg">{result.logMessage}</p>
                  </div>
                  <p className="text-[10px] font-mono text-muted-foreground">{new Date(result.timestamp).toLocaleTimeString()}</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-[10px] font-mono text-muted-foreground uppercase tracking-widest mb-2">Explanation</p>
                    <p className="text-sm text-foreground leading-relaxed">{result.analysis.explanation}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-mono text-muted-foreground uppercase tracking-widest mb-2">
                      <Shield className="h-3 w-3 inline mr-1" />
                      Mitigation Steps
                    </p>
                    <ul className="space-y-1.5">
                      {result.analysis.mitigation.map((step, j) => (
                        <li key={j} className="text-sm font-mono text-foreground flex items-start gap-2">
                          <span className="text-primary font-bold">{j + 1}.</span>
                          {step}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Existing Threat Intelligence */}
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
                {(threat.ttps ?? []).map((ttp) => (
                  <span key={ttp} className="px-2 py-0.5 rounded bg-secondary text-[10px] font-mono text-secondary-foreground">{ttp}</span>
                ))}
              </div>
            </div>
            <div>
              <p className="text-[10px] font-mono text-muted-foreground uppercase tracking-widest mb-2">IOCs</p>
              <div className="space-y-0.5">
                {(threat.iocs ?? []).map((ioc) => (
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

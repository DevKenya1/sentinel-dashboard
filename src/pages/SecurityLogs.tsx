import { motion } from "framer-motion";
import { FileText } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

const levelColors: Record<string, string> = {
  ERROR: "text-destructive",
  WARN: "text-warning",
  INFO: "text-info",
  DEBUG: "text-muted-foreground",
};

export default function SecurityLogs() {
  const { data: logs = [] } = useQuery({
    queryKey: ["security-logs"],
    queryFn: async () => {
      const { data } = await supabase.from("security_logs").select("*").order("created_at", { ascending: false }).limit(50);
      return data ?? [];
    },
    refetchInterval: 5000,
  });

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6 max-w-7xl">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Security Logs</h1>
        <p className="text-sm text-muted-foreground font-mono mt-1">Real-time log stream • Auto-refresh every 5s</p>
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
              <span className="text-muted-foreground shrink-0 w-[180px]">{new Date(log.created_at).toISOString().replace("T", " ").slice(0, 23)}</span>
              <span className={`shrink-0 w-12 font-bold ${levelColors[log.log_level]}`}>{log.log_level}</span>
              <span className="text-primary shrink-0 w-28 truncate">{log.source}</span>
              <span className="text-foreground/80 break-all">{log.message}</span>
            </motion.div>
          ))}
        </div>
      </div>
    </motion.div>
  );
}

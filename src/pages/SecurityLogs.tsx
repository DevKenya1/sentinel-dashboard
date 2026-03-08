import { motion } from "framer-motion";
import { FileText, Search, Filter, AlertTriangle, Loader2, Download, RefreshCw } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useState } from "react";
import { toast } from "sonner";

const levelColors: Record<string, string> = {
  ERROR: "text-destructive",
  WARN: "text-warning",
  INFO: "text-info",
  DEBUG: "text-muted-foreground",
};

const levelBgColors: Record<string, string> = {
  ERROR: "bg-destructive/10 border-destructive/30",
  WARN: "bg-warning/10 border-warning/30",
  INFO: "bg-info/10 border-info/30",
  DEBUG: "bg-muted border-border",
};

const patternLabels: Record<string, string> = {
  brute_force: "Brute Force",
  sql_injection: "SQL Injection",
  unauthorized_access: "Unauthorized Access",
  malware_detected: "Malware",
  port_scanning: "Port Scanning",
  failed_authentication: "Failed Auth",
  privilege_escalation: "Priv Escalation",
  data_exfiltration: "Data Exfil",
  c2_communication: "C2 Comms",
  code_injection: "Code Injection",
  tor_activity: "Tor Activity",
  blocked_traffic: "Blocked Traffic",
  buffer_overflow: "Buffer Overflow",
  dns_threat: "DNS Threat",
};

export default function SecurityLogs() {
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState("");
  const [levelFilter, setLevelFilter] = useState<string>("all");
  const [suspiciousOnly, setSuspiciousOnly] = useState(false);
  const [ipFilter, setIpFilter] = useState("");
  const [page, setPage] = useState(0);
  const pageSize = 30;

  const { data, isLoading, isFetching } = useQuery({
    queryKey: ["security-logs", searchQuery, levelFilter, suspiciousOnly, ipFilter, page],
    queryFn: async () => {
      let query = supabase
        .from("security_logs")
        .select("*", { count: "exact" })
        .order("created_at", { ascending: false })
        .range(page * pageSize, (page + 1) * pageSize - 1);

      if (levelFilter !== "all") query = query.eq("log_level", levelFilter);
      if (suspiciousOnly) query = query.eq("is_suspicious", true);
      if (ipFilter.trim()) query = query.eq("source_ip", ipFilter.trim());
      if (searchQuery.trim()) query = query.textSearch("fts", searchQuery.trim(), { type: "websearch" });

      const { data, error, count } = await query;
      if (error) throw error;
      return { logs: data ?? [], total: count ?? 0 };
    },
    refetchInterval: suspiciousOnly ? 3000 : 5000,
  });

  const { data: stats } = useQuery({
    queryKey: ["log-stats"],
    queryFn: async () => {
      const [totalRes, suspRes, errRes] = await Promise.all([
        supabase.from("security_logs").select("*", { count: "exact", head: true }),
        supabase.from("security_logs").select("*", { count: "exact", head: true }).eq("is_suspicious", true),
        supabase.from("security_logs").select("*", { count: "exact", head: true }).eq("log_level", "ERROR"),
      ]);
      return {
        total: totalRes.count ?? 0,
        suspicious: suspRes.count ?? 0,
        errors: errRes.count ?? 0,
      };
    },
  });

  const collectMutation = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.functions.invoke("log-monitor", {
        body: { count: 15 },
      });
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      toast.success(`Collected ${data.ingested} logs • ${data.suspicious_detected} suspicious detected`);
      queryClient.invalidateQueries({ queryKey: ["security-logs"] });
      queryClient.invalidateQueries({ queryKey: ["log-stats"] });
    },
    onError: (err: any) => toast.error(`Collection failed: ${err.message}`),
  });

  const logs = data?.logs ?? [];
  const total = data?.total ?? 0;
  const totalPages = Math.ceil(total / pageSize);

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-5 max-w-[1400px]">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Security Logs</h1>
          <p className="text-sm text-muted-foreground font-mono mt-1">
            {stats?.total ?? 0} total • {stats?.suspicious ?? 0} suspicious • {stats?.errors ?? 0} errors
          </p>
        </div>
        <button
          onClick={() => collectMutation.mutate()}
          disabled={collectMutation.isPending}
          className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:opacity-90 transition-opacity disabled:opacity-50"
        >
          {collectMutation.isPending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Download className="h-4 w-4" />
          )}
          {collectMutation.isPending ? "Collecting..." : "Collect Logs"}
        </button>
      </div>

      {/* Filters Bar */}
      <div className="flex flex-wrap items-center gap-3 rounded-lg border border-border bg-card p-3">
        {/* Search */}
        <div className="flex items-center gap-2 rounded-lg bg-secondary px-3 py-1.5 flex-1 min-w-[200px]">
          <Search className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => { setSearchQuery(e.target.value); setPage(0); }}
            placeholder="Search logs (full-text)..."
            className="bg-transparent text-xs font-mono text-foreground placeholder:text-muted-foreground outline-none w-full"
          />
        </div>

        {/* IP Filter */}
        <div className="flex items-center gap-2 rounded-lg bg-secondary px-3 py-1.5">
          <span className="text-[10px] font-mono text-muted-foreground">IP:</span>
          <input
            type="text"
            value={ipFilter}
            onChange={(e) => { setIpFilter(e.target.value); setPage(0); }}
            placeholder="Filter by IP..."
            className="bg-transparent text-xs font-mono text-foreground placeholder:text-muted-foreground outline-none w-28"
          />
        </div>

        {/* Level Filter */}
        <div className="flex items-center gap-1.5">
          {["all", "ERROR", "WARN", "INFO", "DEBUG"].map(lvl => (
            <button
              key={lvl}
              onClick={() => { setLevelFilter(lvl); setPage(0); }}
              className={`px-2 py-1 text-[10px] font-mono uppercase rounded border transition-colors ${
                levelFilter === lvl
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-border text-muted-foreground hover:text-foreground"
              }`}
            >
              {lvl}
            </button>
          ))}
        </div>

        {/* Suspicious Toggle */}
        <button
          onClick={() => { setSuspiciousOnly(!suspiciousOnly); setPage(0); }}
          className={`flex items-center gap-1.5 px-2.5 py-1 text-[10px] font-mono rounded border transition-colors ${
            suspiciousOnly
              ? "border-destructive bg-destructive/10 text-destructive"
              : "border-border text-muted-foreground hover:text-foreground"
          }`}
        >
          <AlertTriangle className="h-3 w-3" />
          SUSPICIOUS
        </button>

        {/* Refresh indicator */}
        {isFetching && <RefreshCw className="h-3.5 w-3.5 text-primary animate-spin" />}
      </div>

      {/* Collect Animation */}
      {collectMutation.isPending && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          className="rounded-lg border border-primary/30 bg-primary/5 p-3 glow-primary"
        >
          <div className="flex items-center gap-3">
            <Loader2 className="h-5 w-5 text-primary animate-spin" />
            <div>
              <p className="text-sm font-semibold text-primary">Collecting Logs</p>
              <p className="text-[10px] font-mono text-muted-foreground">
                Ingesting from local machines • Parsing for suspicious patterns...
              </p>
            </div>
          </div>
        </motion.div>
      )}

      {/* Log Table */}
      <div className="rounded-lg border border-border bg-card overflow-hidden">
        <div className="bg-secondary/50 border-b border-border px-4 py-2 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileText className="h-3.5 w-3.5 text-muted-foreground" />
            <span className="text-[10px] font-mono text-muted-foreground tracking-widest">
              {suspiciousOnly ? "SUSPICIOUS LOGS" : "LOG STREAM"}
            </span>
            <div className="h-2 w-2 rounded-full bg-success animate-pulse" />
          </div>
          <span className="text-[10px] font-mono text-muted-foreground">
            {total} results • page {page + 1}/{Math.max(totalPages, 1)}
          </span>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-6 w-6 text-primary animate-spin" />
          </div>
        ) : logs.length === 0 ? (
          <div className="text-center py-12 text-sm text-muted-foreground font-mono">
            No logs found matching your filters
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border bg-secondary/20">
                  <th className="px-3 py-2 text-left text-[10px] font-mono uppercase tracking-widest text-muted-foreground w-[170px]">Timestamp</th>
                  <th className="px-3 py-2 text-left text-[10px] font-mono uppercase tracking-widest text-muted-foreground w-14">Level</th>
                  <th className="px-3 py-2 text-left text-[10px] font-mono uppercase tracking-widest text-muted-foreground w-28">Source</th>
                  <th className="px-3 py-2 text-left text-[10px] font-mono uppercase tracking-widest text-muted-foreground w-28 hidden md:table-cell">IP</th>
                  <th className="px-3 py-2 text-left text-[10px] font-mono uppercase tracking-widest text-muted-foreground">Message</th>
                  <th className="px-3 py-2 text-left text-[10px] font-mono uppercase tracking-widest text-muted-foreground w-28 hidden lg:table-cell">Pattern</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/50 font-mono text-xs">
                {logs.map((log, i) => (
                  <motion.tr
                    key={log.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: i * 0.02 }}
                    className={`hover:bg-secondary/30 transition-colors ${
                      log.is_suspicious ? "bg-destructive/5" : ""
                    }`}
                  >
                    <td className="px-3 py-2 text-muted-foreground whitespace-nowrap">
                      {new Date(log.created_at).toISOString().replace("T", " ").slice(0, 23)}
                    </td>
                    <td className="px-3 py-2">
                      <span className={`inline-flex items-center rounded border px-1.5 py-0.5 text-[10px] font-bold ${
                        levelBgColors[log.log_level]
                      } ${levelColors[log.log_level]}`}>
                        {log.log_level}
                      </span>
                    </td>
                    <td className="px-3 py-2 text-primary truncate max-w-[120px]">{log.source}</td>
                    <td className="px-3 py-2 text-foreground hidden md:table-cell">
                      {log.source_ip ? (
                        <button
                          onClick={() => { setIpFilter(log.source_ip!); setPage(0); }}
                          className="hover:text-primary transition-colors underline decoration-dotted"
                        >
                          {log.source_ip}
                        </button>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </td>
                    <td className="px-3 py-2 text-foreground/80 break-all max-w-md">
                      <span className={log.is_suspicious ? "text-foreground" : ""}>
                        {log.message}
                      </span>
                    </td>
                    <td className="px-3 py-2 hidden lg:table-cell">
                      {log.is_suspicious && log.pattern_matched && (
                        <span className="inline-flex items-center gap-1 rounded bg-destructive/10 border border-destructive/30 px-1.5 py-0.5 text-[9px] text-destructive font-bold uppercase">
                          <AlertTriangle className="h-2.5 w-2.5" />
                          {patternLabels[log.pattern_matched] || log.pattern_matched}
                        </span>
                      )}
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-border px-4 py-2">
            <button
              onClick={() => setPage(Math.max(0, page - 1))}
              disabled={page === 0}
              className="text-[10px] font-mono text-muted-foreground hover:text-foreground disabled:opacity-30 transition-colors"
            >
              ← Previous
            </button>
            <div className="flex items-center gap-1">
              {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
                const p = totalPages <= 7 ? i : page <= 3 ? i : page >= totalPages - 4 ? totalPages - 7 + i : page - 3 + i;
                return (
                  <button
                    key={p}
                    onClick={() => setPage(p)}
                    className={`w-6 h-6 rounded text-[10px] font-mono transition-colors ${
                      page === p ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {p + 1}
                  </button>
                );
              })}
            </div>
            <button
              onClick={() => setPage(Math.min(totalPages - 1, page + 1))}
              disabled={page >= totalPages - 1}
              className="text-[10px] font-mono text-muted-foreground hover:text-foreground disabled:opacity-30 transition-colors"
            >
              Next →
            </button>
          </div>
        )}
      </div>
    </motion.div>
  );
}

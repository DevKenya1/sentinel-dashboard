import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// Suspicious patterns to detect in log messages
const SUSPICIOUS_PATTERNS = [
  { pattern: /brute\s*force/i, label: "brute_force" },
  { pattern: /sql\s*injection/i, label: "sql_injection" },
  { pattern: /unauthorized|forbidden/i, label: "unauthorized_access" },
  { pattern: /malware|trojan|virus|ransomware/i, label: "malware_detected" },
  { pattern: /port\s*scan/i, label: "port_scanning" },
  { pattern: /failed\s*(login|auth|password)/i, label: "failed_authentication" },
  { pattern: /root\s*access|privilege\s*escalation|sudo/i, label: "privilege_escalation" },
  { pattern: /exfiltration|data\s*leak/i, label: "data_exfiltration" },
  { pattern: /c2|command\s*and\s*control|beacon/i, label: "c2_communication" },
  { pattern: /base64.*exec|powershell.*-enc|eval\(/i, label: "code_injection" },
  { pattern: /\.onion|darknet|tor\s*exit/i, label: "tor_activity" },
  { pattern: /denied|blocked|dropped/i, label: "blocked_traffic" },
  { pattern: /overflow|buffer/i, label: "buffer_overflow" },
  { pattern: /dns.*malicious|phishing/i, label: "dns_threat" },
];

function detectSuspicious(message: string): { is_suspicious: boolean; pattern_matched: string | null } {
  for (const { pattern, label } of SUSPICIOUS_PATTERNS) {
    if (pattern.test(message)) {
      return { is_suspicious: true, pattern_matched: label };
    }
  }
  return { is_suspicious: false, pattern_matched: null };
}

// Simulated log sources for log generation
const LOG_TEMPLATES = [
  { source: "firewall-01", hostname: "fw-01.corp.local", level: "ERROR", msgs: [
    "Blocked incoming connection from {ip}:4444 → 10.0.0.1:22 (SSH brute force attempt)",
    "Dropped packet from {ip} — rule: deny-all-inbound",
    "IDS alert: SQL injection attempt from {ip} on port 80",
  ]},
  { source: "auth-server", hostname: "auth.corp.local", level: "WARN", msgs: [
    "Failed login attempt for user admin from {ip} (attempt 5/5)",
    "MFA challenge failed for user jdoe from {ip}",
    "Account lockout triggered for user root from {ip}",
  ]},
  { source: "ids-sensor-03", hostname: "ids-03.corp.local", level: "ERROR", msgs: [
    "Signature match: ET TROJAN Generic RAT CnC Beacon from {ip}",
    "Malware payload detected in HTTP traffic from {ip}",
    "Port scanning activity from {ip} across 10.0.0.0/24",
  ]},
  { source: "waf-proxy", hostname: "waf.corp.local", level: "WARN", msgs: [
    "SQL injection attempt blocked from {ip}: GET /api/users?id=1 OR 1=1",
    "XSS attempt blocked from {ip} in POST body",
    "Rate limit exceeded for {ip} — 500 req/min threshold",
  ]},
  { source: "dns-resolver", hostname: "dns.corp.local", level: "WARN", msgs: [
    "DNS query to known malicious domain: evil-c2.darknet.io from {ip}",
    "DNS tunneling pattern detected from {ip}",
    "Phishing domain resolution blocked: login-secure-bank.tk from {ip}",
  ]},
  { source: "endpoint-agent", hostname: "edr-server.corp.local", level: "ERROR", msgs: [
    "Unauthorized process execution on {ip}: powershell.exe -enc [BASE64]",
    "Privilege escalation attempt detected on {ip}: sudo su -",
    "Ransomware file encryption activity detected on {ip}",
  ]},
  { source: "vpn-gateway", hostname: "vpn.corp.local", level: "INFO", msgs: [
    "New VPN tunnel established from {ip} — user jdoe",
    "VPN session renewed for user analyst01 from {ip}",
    "Certificate-based auth successful from {ip}",
  ]},
  { source: "backup-srv", hostname: "backup.corp.local", level: "INFO", msgs: [
    "Incremental backup completed: 2.3GB, 0 errors",
    "Full backup scheduled for 02:00 UTC",
    "Backup verification passed for DB-Server-01",
  ]},
  { source: "ntp-server", hostname: "ntp.corp.local", level: "DEBUG", msgs: [
    "Time sync completed, drift: +0.002s",
    "NTP peer 10.0.0.1 reachable, stratum 2",
    "Clock adjustment: -0.001s",
  ]},
  { source: "dhcp-server", hostname: "dhcp.corp.local", level: "WARN", msgs: [
    "DHCP lease conflict: IP {ip} assigned to unknown MAC",
    "DHCP pool 90% exhausted in subnet 10.0.1.0/24",
    "Rogue DHCP server detected at {ip}",
  ]},
];

function randomIp(): string {
  const subnets = ["192.168.1", "192.168.2", "10.0.0", "10.0.1", "172.16.0", "203.0.113"];
  const subnet = subnets[Math.floor(Math.random() * subnets.length)];
  return `${subnet}.${Math.floor(Math.random() * 254) + 1}`;
}

function generateLogs(count: number) {
  const logs = [];
  for (let i = 0; i < count; i++) {
    const template = LOG_TEMPLATES[Math.floor(Math.random() * LOG_TEMPLATES.length)];
    const ip = randomIp();
    const msgTemplate = template.msgs[Math.floor(Math.random() * template.msgs.length)];
    const message = msgTemplate.replace(/\{ip\}/g, ip);
    const { is_suspicious, pattern_matched } = detectSuspicious(message);

    // Override level for suspicious entries
    const level = is_suspicious && template.level === "INFO" ? "WARN" : template.level;

    logs.push({
      log_level: level,
      source: template.source,
      hostname: template.hostname,
      source_ip: msgTemplate.includes("{ip}") ? ip : null,
      message,
      raw_log: `${new Date().toISOString()} [${level}] ${template.source}: ${message}`,
      is_suspicious,
      pattern_matched,
    });
  }
  return logs;
}

function getUrlParams(url: URL) {
  return {
    limit: Math.min(parseInt(url.searchParams.get("limit") || "50"), 200),
    offset: parseInt(url.searchParams.get("offset") || "0"),
    search: url.searchParams.get("search") || null,
    level: url.searchParams.get("level") || null,
    ip: url.searchParams.get("ip") || null,
  };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: claimsData, error: claimsError } = await supabase.auth.getClaims(
      authHeader.replace("Bearer ", "")
    );
    if (claimsError || !claimsData?.claims) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const url = new URL(req.url);
    const pathSegments = url.pathname.split("/").filter(Boolean);
    // Path after /log-monitor: e.g., /log-monitor/suspicious → ["log-monitor", "suspicious"]
    const action = pathSegments.length > 1 ? pathSegments[pathSegments.length - 1] : null;

    // POST: Ingest/generate logs
    if (req.method === "POST") {
      const body = await req.json().catch(() => ({}));
      const count = Math.min(Math.max(body.count || 10, 1), 50);

      // If custom logs are provided, parse them; otherwise generate
      let logs;
      if (body.logs && Array.isArray(body.logs)) {
        logs = body.logs.map((log: any) => {
          const { is_suspicious, pattern_matched } = detectSuspicious(log.message || "");
          return {
            log_level: log.level || "INFO",
            source: log.source || "external",
            hostname: log.hostname || null,
            source_ip: log.source_ip || null,
            message: log.message || "",
            raw_log: log.raw_log || null,
            is_suspicious,
            pattern_matched,
          };
        });
      } else {
        logs = generateLogs(count);
      }

      const { data, error } = await supabase.from("security_logs").insert(logs).select();
      if (error) throw error;

      const suspiciousCount = logs.filter((l: any) => l.is_suspicious).length;

      return new Response(
        JSON.stringify({
          success: true,
          ingested: logs.length,
          suspicious_detected: suspiciousCount,
          patterns: [...new Set(logs.filter((l: any) => l.pattern_matched).map((l: any) => l.pattern_matched))],
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // GET: Query logs
    if (req.method === "GET") {
      const { limit, offset, search, level, ip } = getUrlParams(url);

      let query = supabase.from("security_logs").select("*", { count: "exact" });

      // Route-based filtering
      if (action === "suspicious") {
        query = query.eq("is_suspicious", true);
      } else if (action === "by-ip" && ip) {
        query = query.eq("source_ip", ip);
      }

      // Additional filters
      if (level) query = query.eq("log_level", level.toUpperCase());
      if (search) query = query.textSearch("fts", search, { type: "websearch" });

      query = query.order("created_at", { ascending: false }).range(offset, offset + limit - 1);

      const { data, error, count } = await query;
      if (error) throw error;

      return new Response(
        JSON.stringify({
          logs: data,
          total: count,
          limit,
          offset,
          has_more: (count ?? 0) > offset + limit,
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("Log monitor error:", err);
    return new Response(
      JSON.stringify({ error: "Log monitor failed", details: String(err) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

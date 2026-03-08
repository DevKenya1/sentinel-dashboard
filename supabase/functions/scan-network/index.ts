import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// Simulated device templates for realistic Nmap-like output
const DEVICE_TEMPLATES = [
  { type: "router", names: ["GW-Router", "Core-Switch", "Edge-Router", "VPN-Gateway"], os: ["Cisco IOS 15.7", "Juniper JUNOS 21.4", "MikroTik RouterOS 7.6", "pfSense 2.7"], ports: [22, 23, 80, 443, 161, 8443] },
  { type: "server", names: ["Web-Server", "DB-Server", "App-Server", "Mail-Server", "File-Server", "Backup-Server"], os: ["Ubuntu 22.04 LTS", "CentOS Stream 9", "Debian 12", "Windows Server 2022", "Red Hat Enterprise 9"], ports: [22, 80, 443, 3306, 5432, 8080, 8443, 25, 587, 993] },
  { type: "workstation", names: ["WS-Admin", "WS-Dev", "WS-Finance", "WS-HR", "WS-Marketing"], os: ["Windows 11 Pro", "Windows 10 Enterprise", "macOS Sonoma 14.2", "Ubuntu Desktop 22.04"], ports: [135, 139, 445, 3389, 5900] },
  { type: "iot", names: ["IP-Camera", "Smart-Thermostat", "Badge-Reader", "IoT-Sensor", "Smart-Lock"], os: ["Embedded Linux 5.15", "RTOS 3.2", "Contiki-NG 4.8", "FreeRTOS 10.5"], ports: [80, 443, 554, 8080, 1883, 5683] },
  { type: "mobile", names: ["BYOD-Phone", "Corp-Tablet", "Mobile-Device"], os: ["Android 14", "iOS 17.2", "iPadOS 17.2"], ports: [62078] },
  { type: "unknown", names: ["Unknown-Device", "Rogue-Device", "Shadow-IT"], os: ["Unknown"], ports: [80, 443] },
];

function randomFrom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function generateMac(): string {
  return Array.from({ length: 6 }, () =>
    Math.floor(Math.random() * 256).toString(16).padStart(2, "0").toUpperCase()
  ).join(":");
}

function generateDevices(subnet: string, count: number) {
  const [base] = subnet.split("/");
  const octets = base.split(".").map(Number);
  const usedIps = new Set<number>();
  const devices = [];

  for (let i = 0; i < count; i++) {
    let lastOctet: number;
    do {
      lastOctet = Math.floor(Math.random() * 253) + 2; // 2-254
    } while (usedIps.has(lastOctet));
    usedIps.add(lastOctet);

    const ip = `${octets[0]}.${octets[1]}.${octets[2]}.${lastOctet}`;
    const template = randomFrom(DEVICE_TEMPLATES);
    const baseName = randomFrom(template.names);
    const hostname = `${baseName}-${lastOctet}`.toLowerCase();
    const numPorts = Math.min(
      Math.floor(Math.random() * 4) + 1,
      template.ports.length
    );
    const shuffled = [...template.ports].sort(() => Math.random() - 0.5);
    const openPorts = shuffled.slice(0, numPorts).sort((a, b) => a - b);
    const os = randomFrom(template.os);

    // Risk assessment based on ports and device type
    let risk = "low";
    if (template.type === "unknown" || template.type === "iot") risk = "high";
    else if (openPorts.includes(23) || openPorts.includes(21) || openPorts.length > 4) risk = "medium";
    if (openPorts.includes(4444) || openPorts.includes(1337)) risk = "high";

    devices.push({
      name: `${baseName}-${lastOctet}`,
      device_type: template.type,
      ip_address: ip,
      mac_address: generateMac(),
      hostname,
      open_ports: openPorts,
      os,
      risk_level: risk,
      status: "online",
      last_seen: new Date().toISOString(),
    });
  }

  return devices;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Authenticate user
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

    // Parse request body
    const body = await req.json().catch(() => ({}));
    const subnet = body.subnet || "10.0.0.0/24";
    const deviceCount = Math.min(Math.max(body.count || 6, 1), 20);

    const startTime = Date.now();

    // Simulate scan delay (200-800ms)
    await new Promise((resolve) => setTimeout(resolve, 200 + Math.random() * 600));

    // Generate simulated scan results
    const devices = generateDevices(subnet, deviceCount);
    const duration = Date.now() - startTime;

    // Store discovered devices (upsert by IP)
    for (const device of devices) {
      const { error: upsertError } = await supabase
        .from("network_devices")
        .upsert(device, { onConflict: "ip_address", ignoreDuplicates: false });

      if (upsertError) {
        console.error("Upsert error for device:", device.ip_address, upsertError);
      }
    }

    // Log scan in history
    const { error: scanLogError } = await supabase.from("scan_history").insert({
      scan_type: "nmap_simulation",
      subnet,
      devices_found: devices.length,
      duration_ms: duration,
      status: "completed",
    });

    if (scanLogError) {
      console.error("Scan history error:", scanLogError);
    }

    // Also create a security log entry
    await supabase.from("security_logs").insert({
      log_level: "INFO",
      source: "scan-network",
      message: `Network scan completed: ${subnet} — ${devices.length} devices discovered in ${duration}ms`,
    });

    return new Response(
      JSON.stringify({
        success: true,
        scan: {
          subnet,
          devices_found: devices.length,
          duration_ms: duration,
          timestamp: new Date().toISOString(),
        },
        devices: devices.map((d) => ({
          ip: d.ip_address,
          hostname: d.hostname,
          open_ports: d.open_ports,
          os: d.os,
          mac: d.mac_address,
          risk: d.risk_level,
          device_type: d.device_type,
        })),
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (err) {
    console.error("Scan error:", err);
    return new Response(
      JSON.stringify({ error: "Scan failed", details: String(err) }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});

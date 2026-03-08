# SENTINEL — System Architecture

## Table of Contents

- [Overview](#overview)
- [Architecture Diagram](#architecture-diagram)
- [Component Details](#component-details)
- [Data Flow](#data-flow)
- [Database Schema](#database-schema)
- [Security Model](#security-model)
- [AI Engine](#ai-engine)
- [Real-time Architecture](#real-time-architecture)

---

## Overview

SENTINEL follows a **serverless edge architecture** where the React frontend communicates with Supabase Edge Functions (Deno runtime) for compute-intensive operations and directly with the PostgreSQL database for CRUD operations. AI inference is handled via the Lovable AI Gateway, which proxies requests to Google Gemini models.

---

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                        CLIENT LAYER                             │
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │              React 18 + TypeScript + Vite                │   │
│  │                                                          │   │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌───────────┐   │   │
│  │  │Dashboard │ │ Alerts   │ │  Logs    │ │  Threats  │   │   │
│  │  │(Recharts)│ │(Realtime)│ │ (FTS)   │ │  (AI)     │   │   │
│  │  └──────────┘ └──────────┘ └──────────┘ └───────────┘   │   │
│  │  ┌──────────┐ ┌──────────┐                               │   │
│  │  │ Network  │ │ Attack   │  Framer Motion + shadcn/ui    │   │
│  │  │ Devices  │ │   Map    │  Tailwind CSS Dark Theme      │   │
│  │  └──────────┘ └──────────┘                               │   │
│  └──────────────────────────────────────────────────────────┘   │
│            │              │               │                     │
│            │  Supabase JS │  REST API     │  Realtime WS        │
└────────────┼──────────────┼───────────────┼─────────────────────┘
             │              │               │
┌────────────┼──────────────┼───────────────┼─────────────────────┐
│            ▼              ▼               ▼                     │
│                    EDGE FUNCTIONS LAYER                         │
│                                                                 │
│  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐            │
│  │analyze-threat│ │ scan-network │ │ log-monitor  │            │
│  │              │ │              │ │              │            │
│  │ • AI classif.│ │ • Device disc│ │ • Log ingest │            │
│  │ • Auto-alert │ │ • Port scan  │ │ • Pattern    │            │
│  │ • Mitigation │ │ • OS detect  │ │   matching   │            │
│  └──────┬───────┘ └──────┬───────┘ └──────┬───────┘            │
│         │                │                │                     │
│         │    ┌───────────┴────────┐       │                     │
│         │    │  Service Role Key  │       │                     │
│         │    └───────────┬────────┘       │                     │
│         ▼                ▼                ▼                     │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │                   PostgreSQL (Supabase)                  │   │
│  │                                                         │   │
│  │  ┌──────────────┐ ┌──────────────┐ ┌────────────────┐   │   │
│  │  │security_alerts│ │security_logs │ │network_devices │   │   │
│  │  │• severity    │ │• fts index   │ │• open_ports    │   │   │
│  │  │• source_ip   │ │• suspicious  │ │• os detection  │   │   │
│  │  │• auto-alert  │ │• pattern     │ │• risk_level    │   │   │
│  │  └──────────────┘ └──────────────┘ └────────────────┘   │   │
│  │  ┌──────────────┐ ┌──────────────┐                       │   │
│  │  │scan_history  │ │threat_analysis│ RLS Policies          │   │
│  │  │• duration    │ │• TTPs, IOCs  │ on all tables          │   │
│  │  │• devices_fnd │ │• confidence  │                       │   │
│  │  └──────────────┘ └──────────────┘                       │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│                    SUPABASE PLATFORM                             │
│         ┌──────────┐  ┌──────────┐  ┌──────────┐               │
│         │   Auth   │  │ Realtime │  │ Storage  │               │
│         │(email/pw)│  │  (CDC)   │  │ (future) │               │
│         └──────────┘  └──────────┘  └──────────┘               │
└─────────────────────────────────────────────────────────────────┘
             │
             │  HTTPS (Bearer token)
             ▼
┌─────────────────────────────────┐
│     LOVABLE AI GATEWAY          │
│                                 │
│  Google Gemini 3 Flash Preview  │
│  • Tool calling (structured)    │
│  • Threat classification        │
│  • Severity assessment          │
│  • Mitigation generation        │
└─────────────────────────────────┘
```

---

## Component Details

### Frontend (`frontend/`)

| Component | Technology | Purpose |
|-----------|-----------|---------|
| **Dashboard** | Recharts, custom SVG HealthGauge | Real-time metrics, threat trends, network activity |
| **Alerts** | Supabase Realtime, Framer Motion | Severity-filtered alert table with live updates |
| **Security Logs** | Full-text search, pagination | Searchable log viewer with pattern highlighting |
| **Threat Analysis** | AI Gateway integration | Per-log and batch AI threat classification |
| **Attack Map** | react-simple-maps, ZoomableGroup | Geographic visualization of attack sources |
| **Network Devices** | Edge function invocation | Device inventory with scan triggering |

### Backend Edge Functions (`backend/`)

#### `analyze-threat`
- **Runtime:** Deno (Supabase Edge Functions)
- **AI Model:** `google/gemini-3-flash-preview` via Lovable AI Gateway
- **Method:** Structured tool calling for deterministic JSON output
- **Auto-alerting:** Inserts into `security_alerts` for high/critical severity
- **Auth:** Service role key for database writes

#### `scan-network`
- **Simulated Nmap:** Generates realistic device fingerprints
- **Output:** Device IP, hostname, MAC, OS, open ports, risk level
- **Storage:** Upserts into `network_devices`, creates `scan_history` record

#### `log-monitor`
- **Pattern Engine:** 14 regex-based attack signatures
- **Modes:** `collect` (ingest), `suspicious` (filter), `by-ip` (search)
- **Full-text Search:** PostgreSQL `tsvector` index for fast log querying

---

## Data Flow

### Threat Analysis Pipeline

```
Suspicious Log → analyze-threat Edge Function
                       │
                       ├─→ AI Gateway (Gemini Flash)
                       │         │
                       │         ├─→ Tool Call: classify_threat
                       │         │     • threat_type
                       │         │     • severity
                       │         │     • explanation
                       │         │     • mitigation[]
                       │         │
                       │         └─→ Structured JSON response
                       │
                       ├─→ If severity ≥ high:
                       │     INSERT into security_alerts
                       │           │
                       │           └─→ Realtime CDC → Alerts Page
                       │
                       └─→ Return analysis to frontend
```

### Network Scan Pipeline

```
User clicks "Scan" → scan-network Edge Function
                           │
                           ├─→ Generate device fingerprints
                           ├─→ UPSERT network_devices (on ip_address)
                           ├─→ INSERT scan_history
                           └─→ Return scan results
```

---

## Database Schema

### Entity Relationship

```
security_alerts          security_logs            network_devices
┌─────────────┐         ┌──────────────┐         ┌───────────────┐
│ id (PK)     │         │ id (PK)      │         │ id (PK)       │
│ severity    │         │ log_level    │         │ ip_address    │
│ type        │         │ source       │         │ hostname      │
│ source_ip   │         │ message      │         │ mac_address   │
│ target      │         │ source_ip    │         │ device_type   │
│ message     │         │ hostname     │         │ os            │
│ status      │         │ is_suspicious│         │ open_ports[]  │
│ created_at  │         │ pattern_match│         │ risk_level    │
└─────────────┘         │ raw_log      │         │ status        │
                        │ fts (tsvec)  │         │ last_seen     │
                        │ created_at   │         │ created_at    │
                        └──────────────┘         └───────────────┘

scan_history             threat_analysis
┌──────────────┐         ┌───────────────┐
│ id (PK)      │         │ id (PK)       │
│ subnet       │         │ name          │
│ scan_type    │         │ threat_type   │
│ devices_found│         │ origin        │
│ duration_ms  │         │ confidence    │
│ status       │         │ status        │
│ created_at   │         │ description   │
└──────────────┘         │ ttps[]        │
                         │ iocs[]        │
                         │ created_at    │
                         └───────────────┘
```

### Indexes

- `security_logs.fts` — GIN index on `tsvector` for full-text search
- `security_logs.source_ip` — B-tree for IP-based log filtering
- `security_logs.is_suspicious` — Partial index for suspicious log queries
- `network_devices.ip_address` — Unique constraint for upsert operations

---

## Security Model

### Authentication
- Email/password authentication via Supabase Auth
- Session persistence with auto-refresh tokens
- Protected routes redirect unauthenticated users to `/auth`

### Row-Level Security (RLS)
All tables have RLS enabled. Current policies require authentication for all operations:

| Table | SELECT | INSERT | UPDATE | DELETE |
|-------|--------|--------|--------|--------|
| `security_alerts` | ✅ Auth | ✅ Auth | ✅ Auth | ❌ |
| `security_logs` | ✅ Auth | ✅ Auth | ❌ | ❌ |
| `network_devices` | ✅ Auth | ✅ Auth | ✅ Auth | ❌ |
| `scan_history` | ✅ Auth | ✅ Auth | ❌ | ❌ |
| `threat_analysis` | ✅ Auth | ✅ Auth | ❌ | ❌ |

### Edge Function Security
- `verify_jwt = false` — Functions handle auth internally or use service role key
- Service role key used only server-side for auto-alert insertion
- AI Gateway authenticated via `LOVABLE_API_KEY` (never exposed to client)

---

## AI Engine

### Model Selection
- **Primary:** `google/gemini-3-flash-preview` — Fast, cost-effective, strong reasoning
- **Fallback potential:** `google/gemini-2.5-pro` for complex multi-log correlation

### Structured Output
Uses OpenAI-compatible tool calling to ensure deterministic JSON output:

```typescript
tools: [{
  type: "function",
  function: {
    name: "classify_threat",
    parameters: {
      threat_type: "string",    // e.g., brute_force, sql_injection
      severity: "enum",         // critical | high | medium | low
      explanation: "string",    // Technical analysis
      mitigation: "string[]"    // 2-4 actionable steps
    }
  }
}]
```

### Supported Threat Classifications
`brute_force` · `sql_injection` · `malware` · `ransomware` · `phishing` · `ddos` · `port_scan` · `data_exfiltration` · `privilege_escalation` · `unauthorized_access` · `reconnaissance` · `zero_day` · `insider_threat` · `cryptojacking`

---

## Real-time Architecture

The platform uses Supabase Realtime (PostgreSQL Change Data Capture) for live updates:

```
Database INSERT/UPDATE
        │
        ▼
PostgreSQL WAL → Realtime Server → WebSocket → React Client
                                                    │
                                                    ▼
                                          useQuery invalidation
                                          → Re-fetch & re-render
```

Currently enabled on: `security_alerts`

---

## Future Roadmap

- [ ] GeoIP resolution for real attack source coordinates
- [ ] Multi-tenant support with organization-scoped RLS
- [ ] Scheduled automated scans via pg_cron
- [ ] SIEM integration (Splunk, Elastic) via webhook ingestion
- [ ] Threat intelligence feed aggregation (MITRE ATT&CK mapping)
- [ ] Email/Slack notification channels for critical alerts
- [ ] Export reports as PDF with executive summary

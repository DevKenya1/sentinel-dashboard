<div align="center">

# 🛡️ SENTINEL — AI Security Operations Platform

**Enterprise-grade cybersecurity operations platform powered by artificial intelligence**

[![Built with Lovable](https://img.shields.io/badge/Built%20with-Lovable-ff69b4?style=flat-square)](https://lovable.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.8-3178C6?style=flat-square&logo=typescript&logoColor=white)](https://typescriptlang.org)
[![React](https://img.shields.io/badge/React-18.3-61DAFB?style=flat-square&logo=react&logoColor=black)](https://react.dev)
[![Supabase](https://img.shields.io/badge/Supabase-Cloud-3FCF8E?style=flat-square&logo=supabase&logoColor=white)](https://supabase.com)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow?style=flat-square)](LICENSE)

[Live Demo](#) · [Architecture](docs/architecture.md) · [API Documentation](#api-documentation) · [Installation](#installation)

</div>

---

## Overview

SENTINEL is a full-stack AI-powered Security Operations Center (SOC) platform that provides real-time threat detection, automated log analysis, network scanning, and intelligent threat classification. Designed for security analysts and IT operations teams who need centralized visibility into their security posture.

### Key Capabilities

| Feature | Description |
|---------|-------------|
| **AI Threat Analysis** | Automated threat classification using LLM-powered analysis with structured severity assessment and mitigation recommendations |
| **Network Discovery** | Simulated Nmap-style network scanning with device fingerprinting, OS detection, and open port enumeration |
| **Log Monitoring** | Real-time log ingestion with pattern matching across 14+ attack signatures including brute force, SQL injection, and data exfiltration |
| **Automated Alerting** | AI-generated security alerts with severity-based routing and real-time dashboard updates |
| **Attack Visualization** | Interactive world map plotting attack source IPs with severity coloring and drill-down capabilities |
| **SOC Dashboard** | Real-time operational dashboard with threat trends, network activity charts, and health scoring |

---

## Screenshots

<div align="center">

### Dashboard
> Real-time SOC dashboard with threat metrics, network activity charts, and health gauge

![Dashboard](https://github.com/user-attachments/assets/a66cec43-06ca-42d6-b553-7ec5d974ffe4)

### Threat Analysis
> AI-powered threat classification with severity assessment and mitigation steps

![Threat Analysis](<img width="1305" height="551" alt="image" src="https://github.com/user-attachments/assets/280d6a82-0663-4802-bceb-e20aa73377be" />)

### Attack Map
> Global attack visualization with severity-colored markers and IP drill-down

![Attack Map](<img width="1310" height="633" alt="image" src="https://github.com/user-attachments/assets/dcf92786-2801-4df0-955d-5660d836583f" />)

### Security Logs
> Searchable log monitoring with pattern detection and suspicious activity filtering

![Security Logs](<img width="1308" height="592" alt="image" src="https://github.com/user-attachments/assets/e93432cd-b152-4098-ac9c-81d23820bba5" />)

### Network Devices
> Device inventory with OS fingerprinting, open ports, and risk assessment

![Network Devices](<img width="1325" height="628" alt="image" src="https://github.com/user-attachments/assets/683f672d-df9e-4b1e-956b-03e8f714633e" />)

</div>

---

## Architecture

> See [docs/architecture.md](docs/architecture.md) for the complete architecture document.

```
ai-security-operations-platform/
│
├── frontend/                    # React 18 + TypeScript + Vite
│   ├── src/
│   │   ├── components/          # Reusable UI components (shadcn/ui)
│   │   ├── pages/               # Route-level page components
│   │   │   ├── Dashboard.tsx    # SOC dashboard with charts
│   │   │   ├── Alerts.tsx       # Security alerts with filtering
│   │   │   ├── NetworkDevices.tsx # Device inventory
│   │   │   ├── SecurityLogs.tsx # Log monitoring & search
│   │   │   ├── ThreatAnalysis.tsx # AI threat analysis
│   │   │   └── AttackMap.tsx    # Global attack visualization
│   │   ├── contexts/            # Auth context provider
│   │   ├── hooks/               # Custom React hooks
│   │   └── integrations/        # Supabase client & types
│   └── index.html
│
├── backend/                     # Supabase Edge Functions (Deno)
│   ├── analyze-threat/          # AI threat classification engine
│   ├── scan-network/            # Network discovery scanner
│   └── log-monitor/             # Log ingestion & pattern matching
│
├── scanner/                     # Network scanning logic
│   └── (integrated in scan-network edge function)
│
├── ai-engine/                   # AI/ML threat analysis
│   └── (integrated in analyze-threat edge function)
│
├── docs/
│   ├── architecture.md          # System architecture document
│   └── screenshots/             # Application screenshots
│
└── README.md
```

### Technology Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | React 18, TypeScript 5.8, Vite 5, Tailwind CSS 3 |
| **UI Components** | shadcn/ui, Radix Primitives, Framer Motion |
| **Charts** | Recharts, react-simple-maps |
| **Backend** | Supabase Edge Functions (Deno runtime) |
| **Database** | PostgreSQL (via Supabase) with RLS policies |
| **AI Engine** | Google Gemini Flash via Lovable AI Gateway |
| **Auth** | Supabase Auth with email/password |
| **Real-time** | Supabase Realtime (PostgreSQL CDC) |

---

## Installation

### Prerequisites

- [Node.js](https://nodejs.org/) 18+ and npm
- A [Lovable](https://lovable.dev) account (for cloud backend) **or** a [Supabase](https://supabase.com) project

### Quick Start

```bash
# 1. Clone the repository
git clone https://github.com/your-org/ai-security-operations-platform.git
cd ai-security-operations-platform

# 2. Install dependencies
npm install

# 3. Configure environment
cp .env.example .env
# Edit .env with your Supabase project credentials:
#   VITE_SUPABASE_URL=https://your-project.supabase.co
#   VITE_SUPABASE_PUBLISHABLE_KEY=your-anon-key

# 4. Run database migrations
npx supabase db push

# 5. Deploy edge functions
npx supabase functions deploy analyze-threat
npx supabase functions deploy scan-network
npx supabase functions deploy log-monitor

# 6. Start development server
npm run dev
```

### Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `VITE_SUPABASE_URL` | Supabase project URL | ✅ |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | Supabase anon/public key | ✅ |
| `LOVABLE_API_KEY` | AI Gateway key (auto-provisioned on Lovable Cloud) | For AI features |

### Database Setup

The platform requires the following PostgreSQL tables (created via migrations):

- **`security_alerts`** — Security alerts with severity, source IP, and status tracking
- **`security_logs`** — Ingested logs with full-text search and pattern matching
- **`network_devices`** — Discovered devices with OS, ports, and risk levels
- **`scan_history`** — Network scan metadata and results
- **`threat_analysis`** — Threat intelligence records with TTPs and IOCs

All tables have Row-Level Security (RLS) enabled requiring authentication.

---

## API Documentation

### Edge Functions

All endpoints are invoked via Supabase Edge Functions. Authentication is handled via the `Authorization: Bearer <anon-key>` header.

---

#### `POST /functions/v1/analyze-threat`

AI-powered threat classification for suspicious security logs.

**Request Body:**
```json
{
  "log": {
    "message": "Multiple failed SSH login attempts from 192.168.1.100",
    "source": "sshd",
    "log_level": "ERROR",
    "source_ip": "192.168.1.100",
    "hostname": "prod-server-01",
    "pattern_matched": "brute_force",
    "created_at": "2026-03-08T12:00:00Z"
  }
}
```

**Response:**
```json
{
  "threat_type": "brute_force",
  "severity": "high",
  "explanation": "Multiple failed SSH authentication attempts detected from a single IP address, indicating a credential stuffing or brute force attack targeting the SSH service.",
  "mitigation": [
    "Block source IP 192.168.1.100 at the firewall level",
    "Enable fail2ban or similar intrusion prevention on SSH",
    "Enforce key-based SSH authentication and disable password login",
    "Review authentication logs for successful logins from this IP"
  ]
}
```

> **Auto-alerting:** When severity is `high` or `critical`, a security alert is automatically created in the `security_alerts` table.

---

#### `POST /functions/v1/scan-network`

Triggers a network discovery scan on the specified subnet.

**Request Body:**
```json
{
  "subnet": "192.168.1.0/24"
}
```

**Response:**
```json
{
  "success": true,
  "devicesFound": 8,
  "scanDuration": 2340,
  "devices": [
    {
      "ip_address": "192.168.1.1",
      "hostname": "gateway.local",
      "mac_address": "AA:BB:CC:DD:EE:01",
      "device_type": "router",
      "os": "Linux 5.x (OpenWrt)",
      "open_ports": [22, 80, 443],
      "risk_level": "low",
      "status": "online"
    }
  ]
}
```

---

#### `POST /functions/v1/log-monitor`

Ingests and analyzes security logs with pattern matching.

**Request Body:**
```json
{
  "action": "collect"
}
```

**Response:**
```json
{
  "success": true,
  "logsCollected": 15,
  "suspiciousCount": 3,
  "patterns": ["brute_force", "sql_injection", "port_scanning"]
}
```

#### `GET /functions/v1/log-monitor?mode=suspicious`

Returns suspicious logs with pagination.

#### `GET /functions/v1/log-monitor?mode=by-ip&ip=192.168.1.100`

Returns logs filtered by source IP address.

---

## Development

```bash
# Start dev server with hot reload
npm run dev

# Run tests
npm test

# Type checking
npx tsc --noEmit

# Lint
npm run lint

# Production build
npm run build
```

### Project Scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Start Vite dev server on port 8080 |
| `npm run build` | Production build |
| `npm test` | Run Vitest test suite |
| `npm run lint` | ESLint check |

---

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/threat-intel-feeds`)
3. Commit changes (`git commit -m 'Add external threat intel feed integration'`)
4. Push to branch (`git push origin feature/threat-intel-feeds`)
5. Open a Pull Request

---

## License

This project is licensed under the MIT License. See [LICENSE](LICENSE) for details.

---

<div align="center">

**Built with [Lovable](https://lovable.dev)** — AI-powered full-stack development

</div>

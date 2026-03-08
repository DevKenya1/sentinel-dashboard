-- Create tables for the security operations platform

-- Alerts table
CREATE TABLE public.security_alerts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  severity TEXT NOT NULL CHECK (severity IN ('critical', 'high', 'medium', 'low')),
  type TEXT NOT NULL,
  source_ip TEXT NOT NULL,
  target TEXT NOT NULL,
  message TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'investigating', 'resolved')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Network devices table
CREATE TABLE public.network_devices (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  device_type TEXT NOT NULL,
  ip_address TEXT NOT NULL,
  mac_address TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'online' CHECK (status IN ('online', 'offline')),
  os TEXT,
  risk_level TEXT NOT NULL DEFAULT 'low' CHECK (risk_level IN ('low', 'medium', 'high')),
  last_seen TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Security logs table
CREATE TABLE public.security_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  log_level TEXT NOT NULL CHECK (log_level IN ('ERROR', 'WARN', 'INFO', 'DEBUG')),
  source TEXT NOT NULL,
  message TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Threat analysis table
CREATE TABLE public.threat_analysis (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  confidence INTEGER NOT NULL CHECK (confidence BETWEEN 0 AND 100),
  threat_type TEXT NOT NULL,
  origin TEXT NOT NULL,
  ttps TEXT[] NOT NULL DEFAULT '{}',
  iocs TEXT[] NOT NULL DEFAULT '{}',
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'monitoring', 'resolved')),
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.security_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.network_devices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.security_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.threat_analysis ENABLE ROW LEVEL SECURITY;

-- Authenticated users can read all data
CREATE POLICY "Authenticated users can read alerts" ON public.security_alerts FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can read devices" ON public.network_devices FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can read logs" ON public.security_logs FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can read threats" ON public.threat_analysis FOR SELECT TO authenticated USING (true);

-- Authenticated users can insert data
CREATE POLICY "Authenticated users can insert alerts" ON public.security_alerts FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can insert devices" ON public.network_devices FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can insert logs" ON public.security_logs FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can insert threats" ON public.threat_analysis FOR INSERT TO authenticated WITH CHECK (true);

-- Authenticated users can update
CREATE POLICY "Authenticated users can update alerts" ON public.security_alerts FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Authenticated users can update devices" ON public.network_devices FOR UPDATE TO authenticated USING (true);
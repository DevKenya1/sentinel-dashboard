-- Add hostname and open_ports columns to network_devices
ALTER TABLE public.network_devices ADD COLUMN hostname TEXT;
ALTER TABLE public.network_devices ADD COLUMN open_ports INTEGER[] NOT NULL DEFAULT '{}';

-- Create a scan_history table to track scans
CREATE TABLE public.scan_history (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  scan_type TEXT NOT NULL DEFAULT 'network',
  subnet TEXT NOT NULL,
  devices_found INTEGER NOT NULL DEFAULT 0,
  duration_ms INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'completed' CHECK (status IN ('running', 'completed', 'failed')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.scan_history ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users can read scans" ON public.scan_history FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can insert scans" ON public.scan_history FOR INSERT TO authenticated WITH CHECK (true);
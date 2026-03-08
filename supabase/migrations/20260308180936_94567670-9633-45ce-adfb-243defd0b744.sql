-- Add unique constraint on ip_address for upsert support
ALTER TABLE public.network_devices ADD CONSTRAINT network_devices_ip_address_key UNIQUE (ip_address);
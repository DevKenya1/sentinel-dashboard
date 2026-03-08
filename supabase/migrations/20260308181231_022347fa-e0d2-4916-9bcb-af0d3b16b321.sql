-- Add columns for enhanced log monitoring
ALTER TABLE public.security_logs ADD COLUMN source_ip TEXT;
ALTER TABLE public.security_logs ADD COLUMN is_suspicious BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE public.security_logs ADD COLUMN pattern_matched TEXT;
ALTER TABLE public.security_logs ADD COLUMN hostname TEXT;
ALTER TABLE public.security_logs ADD COLUMN raw_log TEXT;

-- Add full-text search index
ALTER TABLE public.security_logs ADD COLUMN fts tsvector 
  GENERATED ALWAYS AS (to_tsvector('english', coalesce(message, '') || ' ' || coalesce(source, '') || ' ' || coalesce(source_ip, ''))) STORED;
CREATE INDEX idx_security_logs_fts ON public.security_logs USING GIN (fts);

-- Add indexes for common queries
CREATE INDEX idx_security_logs_suspicious ON public.security_logs (is_suspicious) WHERE is_suspicious = true;
CREATE INDEX idx_security_logs_source_ip ON public.security_logs (source_ip);
CREATE INDEX idx_security_logs_created_at ON public.security_logs (created_at DESC);
CREATE INDEX idx_security_logs_level ON public.security_logs (log_level);
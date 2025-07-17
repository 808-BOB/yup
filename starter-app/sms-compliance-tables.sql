-- SMS Compliance Tables for A2P Requirements
-- Add these tables to support proper SMS opt-out management and webhook logging

-- 1. Add opt-out columns to users table
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS sms_opt_out BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS sms_opt_out_date TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS sms_opt_out_keyword TEXT,
ADD COLUMN IF NOT EXISTS sms_opt_in_date TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS sms_opt_in_keyword TEXT;

-- 2. Create SMS opt-outs tracking table
CREATE TABLE IF NOT EXISTS sms_opt_outs (
    id SERIAL PRIMARY KEY,
    phone_number TEXT NOT NULL,
    opt_out_keyword TEXT NOT NULL,
    opt_out_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    method TEXT DEFAULT 'sms' CHECK (method IN ('sms', 'web', 'email')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for performance
CREATE INDEX IF NOT EXISTS idx_sms_opt_outs_phone ON sms_opt_outs(phone_number);
CREATE INDEX IF NOT EXISTS idx_sms_opt_outs_date ON sms_opt_outs(opt_out_date);

-- 3. Create SMS webhook logs table
CREATE TABLE IF NOT EXISTS sms_webhook_logs (
    id SERIAL PRIMARY KEY,
    phone_number TEXT NOT NULL,
    message_body TEXT NOT NULL,
    message_sid TEXT,
    webhook_type TEXT DEFAULT 'incoming' CHECK (webhook_type IN ('incoming', 'status')),
    processed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for performance
CREATE INDEX IF NOT EXISTS idx_sms_webhook_logs_phone ON sms_webhook_logs(phone_number);
CREATE INDEX IF NOT EXISTS idx_sms_webhook_logs_date ON sms_webhook_logs(processed_at);
CREATE INDEX IF NOT EXISTS idx_sms_webhook_logs_sid ON sms_webhook_logs(message_sid);

-- 4. Create SMS compliance log table
CREATE TABLE IF NOT EXISTS sms_compliance_logs (
    id SERIAL PRIMARY KEY,
    phone_number TEXT NOT NULL,
    event_type TEXT NOT NULL CHECK (event_type IN ('opt_in', 'opt_out', 'message_sent', 'message_failed')),
    message_content TEXT,
    campaign_type TEXT CHECK (campaign_type IN ('verification', 'notification', 'invitation', 'reminder')),
    consent_timestamp TIMESTAMP WITH TIME ZONE,
    message_sid TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for performance
CREATE INDEX IF NOT EXISTS idx_sms_compliance_logs_phone ON sms_compliance_logs(phone_number);
CREATE INDEX IF NOT EXISTS idx_sms_compliance_logs_event ON sms_compliance_logs(event_type);
CREATE INDEX IF NOT EXISTS idx_sms_compliance_logs_date ON sms_compliance_logs(created_at);

-- 5. Create function to check if user has opted out
CREATE OR REPLACE FUNCTION check_sms_opt_out(phone_number_param TEXT)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM users 
        WHERE phone_number = phone_number_param 
        AND sms_opt_out = TRUE
    );
END;
$$ LANGUAGE plpgsql;

-- 6. Create function to log SMS compliance events
CREATE OR REPLACE FUNCTION log_sms_compliance_event(
    phone_number_param TEXT,
    event_type_param TEXT,
    message_content_param TEXT DEFAULT NULL,
    campaign_type_param TEXT DEFAULT NULL,
    message_sid_param TEXT DEFAULT NULL
) RETURNS VOID AS $$
BEGIN
    INSERT INTO sms_compliance_logs (
        phone_number,
        event_type,
        message_content,
        campaign_type,
        message_sid,
        consent_timestamp
    ) VALUES (
        phone_number_param,
        event_type_param,
        message_content_param,
        campaign_type_param,
        message_sid_param,
        NOW()
    );
END;
$$ LANGUAGE plpgsql;

-- 7. Create RLS policies for SMS compliance tables
ALTER TABLE sms_opt_outs ENABLE ROW LEVEL SECURITY;
ALTER TABLE sms_webhook_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE sms_compliance_logs ENABLE ROW LEVEL SECURITY;

-- Allow service role to manage all SMS compliance data
CREATE POLICY "Service role can manage SMS opt-outs" ON sms_opt_outs
    FOR ALL USING (true);

CREATE POLICY "Service role can manage SMS webhook logs" ON sms_webhook_logs
    FOR ALL USING (true);

CREATE POLICY "Service role can manage SMS compliance logs" ON sms_compliance_logs
    FOR ALL USING (true);

-- Users can view their own opt-out status
CREATE POLICY "Users can view their SMS opt-out status" ON users
    FOR SELECT USING (auth.uid() = id);

-- Users can update their own opt-out status
CREATE POLICY "Users can update their SMS opt-out status" ON users
    FOR UPDATE USING (auth.uid() = id);

-- 8. Create indexes on users table for SMS fields
CREATE INDEX IF NOT EXISTS idx_users_phone_number ON users(phone_number);
CREATE INDEX IF NOT EXISTS idx_users_sms_opt_out ON users(sms_opt_out);

-- 9. Sample data for testing (optional, remove in production)
-- INSERT INTO sms_compliance_logs (phone_number, event_type, campaign_type, message_content)
-- VALUES ('+15551234567', 'opt_in', 'verification', 'User consented to SMS during phone verification');

COMMENT ON TABLE sms_opt_outs IS 'Tracks SMS opt-out requests for compliance';
COMMENT ON TABLE sms_webhook_logs IS 'Logs incoming SMS webhook messages';
COMMENT ON TABLE sms_compliance_logs IS 'Comprehensive SMS compliance and audit log';
COMMENT ON FUNCTION check_sms_opt_out(TEXT) IS 'Checks if a phone number has opted out of SMS';
COMMENT ON FUNCTION log_sms_compliance_event(TEXT, TEXT, TEXT, TEXT, TEXT) IS 'Logs SMS compliance events for audit trail'; 
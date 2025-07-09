-- Optimize Invitations & Responses Database Schema
-- This script updates the existing tables to create a proper invitation system

-- 1. Update the invitations table to be more comprehensive
DROP TABLE IF EXISTS invitations CASCADE;
CREATE TABLE invitations (
    id SERIAL PRIMARY KEY,
    event_id INTEGER REFERENCES events(id) ON DELETE CASCADE NOT NULL,
    invited_by UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL, -- Host who sent invitation
    
    -- Invitation method and recipient info
    invitation_method TEXT NOT NULL CHECK (invitation_method IN ('sms', 'email', 'link')),
    recipient_phone TEXT, -- For SMS invitations
    recipient_email TEXT, -- For email invitations
    recipient_name TEXT, -- Optional name of invitee
    
    -- Invitation status tracking
    status TEXT DEFAULT 'sent' CHECK (status IN ('sent', 'delivered', 'failed', 'opened', 'responded')),
    sent_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    delivered_at TIMESTAMP WITH TIME ZONE,
    opened_at TIMESTAMP WITH TIME ZONE,
    
    -- Integration tracking
    twilio_message_sid TEXT, -- Twilio message ID for SMS
    email_message_id TEXT, -- Email service message ID
    
    -- Metadata
    invitation_token UUID DEFAULT gen_random_uuid() UNIQUE, -- For tracking clicks/opens
    custom_message TEXT, -- Custom message included with invitation
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for performance
CREATE INDEX idx_invitations_event_id ON invitations(event_id);
CREATE INDEX idx_invitations_token ON invitations(invitation_token);
CREATE INDEX idx_invitations_recipient_phone ON invitations(recipient_phone);
CREATE INDEX idx_invitations_recipient_email ON invitations(recipient_email);

-- 2. Update the responses table to link to invitations
ALTER TABLE responses ADD COLUMN IF NOT EXISTS invitation_id INTEGER REFERENCES invitations(id) ON DELETE SET NULL;
ALTER TABLE responses ADD COLUMN IF NOT EXISTS response_token UUID DEFAULT gen_random_uuid() UNIQUE;
ALTER TABLE responses ADD COLUMN IF NOT EXISTS responded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Update existing responses to have tokens
UPDATE responses SET response_token = gen_random_uuid() WHERE response_token IS NULL;

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_responses_invitation_id ON responses(invitation_id);
CREATE INDEX IF NOT EXISTS idx_responses_response_token ON responses(response_token);
CREATE INDEX IF NOT EXISTS idx_responses_event_id_user_id ON responses(event_id, user_id);

-- 3. Create a view for easy invitation tracking
CREATE OR REPLACE VIEW invitation_analytics AS
SELECT 
    i.id as invitation_id,
    i.event_id,
    e.title as event_title,
    i.invitation_method,
    i.recipient_phone,
    i.recipient_email,
    i.recipient_name,
    i.status as invitation_status,
    i.sent_at,
    i.delivered_at,
    i.opened_at,
    r.id as response_id,
    r.response_type,
    r.responded_at,
    r.is_guest,
    r.guest_name,
    r.guest_email,
    r.guest_count,
    CASE 
        WHEN r.id IS NOT NULL THEN 'responded'
        WHEN i.opened_at IS NOT NULL THEN 'opened'
        WHEN i.delivered_at IS NOT NULL THEN 'delivered'
        ELSE i.status
    END as final_status
FROM invitations i
LEFT JOIN responses r ON i.id = r.invitation_id
LEFT JOIN events e ON i.event_id = e.id;

-- 4. Create a function to automatically update invitation status when response is created
CREATE OR REPLACE FUNCTION update_invitation_status_on_response()
RETURNS TRIGGER AS $$
BEGIN
    -- Update the invitation status to 'responded' if a response is linked
    IF NEW.invitation_id IS NOT NULL THEN
        UPDATE invitations 
        SET status = 'responded', updated_at = NOW()
        WHERE id = NEW.invitation_id;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for the function
DROP TRIGGER IF EXISTS trigger_update_invitation_status ON responses;
CREATE TRIGGER trigger_update_invitation_status
    AFTER INSERT OR UPDATE ON responses
    FOR EACH ROW
    EXECUTE FUNCTION update_invitation_status_on_response();

-- 5. Create a table for tracking invitation templates and branding
CREATE TABLE IF NOT EXISTS invitation_templates (
    id SERIAL PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    template_name TEXT NOT NULL,
    template_type TEXT NOT NULL CHECK (template_type IN ('sms', 'email')),
    
    -- Template content
    subject TEXT, -- For email templates
    message_template TEXT NOT NULL, -- Template with placeholders like {{event_name}}
    
    -- Branding
    use_custom_branding BOOLEAN DEFAULT false,
    logo_url TEXT,
    primary_color TEXT,
    secondary_color TEXT,
    
    is_default BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(user_id, template_name, template_type)
);

-- 6. Create a table for guest invitation links (for bulk sharing)
CREATE TABLE IF NOT EXISTS guest_invitation_links (
    id SERIAL PRIMARY KEY,
    event_id INTEGER REFERENCES events(id) ON DELETE CASCADE NOT NULL,
    created_by UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    
    -- Link details
    link_token UUID DEFAULT gen_random_uuid() UNIQUE NOT NULL,
    link_name TEXT, -- Optional name for the link (e.g., "Facebook Share", "WhatsApp Group")
    
    -- Access control
    is_active BOOLEAN DEFAULT true,
    expires_at TIMESTAMP WITH TIME ZONE,
    max_uses INTEGER, -- NULL = unlimited
    current_uses INTEGER DEFAULT 0,
    
    -- Tracking
    last_used_at TIMESTAMP WITH TIME ZONE,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_guest_links_event_id ON guest_invitation_links(event_id);
CREATE INDEX idx_guest_links_token ON guest_invitation_links(link_token);

-- 7. Update events table to support better guest management
ALTER TABLE events ADD COLUMN IF NOT EXISTS public_rsvp_enabled BOOLEAN DEFAULT true;
ALTER TABLE events ADD COLUMN IF NOT EXISTS guest_approval_required BOOLEAN DEFAULT false;
ALTER TABLE events ADD COLUMN IF NOT EXISTS auto_approve_guests BOOLEAN DEFAULT true;

-- 8. Create RLS policies for the new tables

-- Invitations: Users can see invitations for their events and invitations sent to them
ALTER TABLE invitations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view invitations for their events" ON invitations
    FOR SELECT USING (
        invited_by = auth.uid() OR 
        EXISTS (
            SELECT 1 FROM events 
            WHERE events.id = invitations.event_id 
            AND events.host_id = auth.uid()
        )
    );

CREATE POLICY "Users can create invitations for their events" ON invitations
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM events 
            WHERE events.id = event_id 
            AND events.host_id = auth.uid()
        )
    );

CREATE POLICY "Users can update their invitations" ON invitations
    FOR UPDATE USING (
        invited_by = auth.uid() OR 
        EXISTS (
            SELECT 1 FROM events 
            WHERE events.id = invitations.event_id 
            AND events.host_id = auth.uid()
        )
    );

-- Invitation templates: Users can only see their own templates
ALTER TABLE invitation_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own invitation templates" ON invitation_templates
    FOR ALL USING (user_id = auth.uid());

-- Guest invitation links: Users can see links for their events
ALTER TABLE guest_invitation_links ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage guest links for their events" ON guest_invitation_links
    FOR ALL USING (
        created_by = auth.uid() OR 
        EXISTS (
            SELECT 1 FROM events 
            WHERE events.id = guest_invitation_links.event_id 
            AND events.host_id = auth.uid()
        )
    );

-- 9. Create default invitation templates for new users
INSERT INTO invitation_templates (user_id, template_name, template_type, message_template, is_default)
SELECT DISTINCT 
    id as user_id,
    'Default SMS' as template_name,
    'sms' as template_type,
    'Hi! {{host_name}} invited you to "{{event_name}}" on {{event_date}}. RSVP here: {{rsvp_link}}' as message_template,
    true as is_default
FROM auth.users 
WHERE id NOT IN (
    SELECT user_id FROM invitation_templates 
    WHERE template_type = 'sms' AND is_default = true
)
ON CONFLICT (user_id, template_name, template_type) DO NOTHING;

INSERT INTO invitation_templates (user_id, template_name, template_type, subject, message_template, is_default)
SELECT DISTINCT 
    id as user_id,
    'Default Email' as template_name,
    'email' as template_type,
    'Invitation: {{event_name}}' as subject,
    'Hi!\n\n{{host_name}} has invited you to {{event_name}}.\n\nDate: {{event_date}}\nTime: {{event_time}}\nLocation: {{event_location}}\n\n{{event_description}}\n\nPlease RSVP by clicking here: {{rsvp_link}}\n\nLooking forward to seeing you there!' as message_template,
    true as is_default
FROM auth.users 
WHERE id NOT IN (
    SELECT user_id FROM invitation_templates 
    WHERE template_type = 'email' AND is_default = true
)
ON CONFLICT (user_id, template_name, template_type) DO NOTHING;

-- 10. Create a function to clean up old invitation data
CREATE OR REPLACE FUNCTION cleanup_old_invitations()
RETURNS void AS $$
BEGIN
    -- Delete invitations older than 1 year for events that have passed
    DELETE FROM invitations 
    WHERE created_at < NOW() - INTERVAL '1 year'
    AND event_id IN (
        SELECT id FROM events 
        WHERE date < CURRENT_DATE - INTERVAL '30 days'
    );
    
    -- Update failed invitations older than 7 days
    UPDATE invitations 
    SET status = 'failed'
    WHERE status = 'sent' 
    AND sent_at < NOW() - INTERVAL '7 days';
END;
$$ LANGUAGE plpgsql;

-- Add a helpful comment
COMMENT ON TABLE invitations IS 'Tracks all invitations sent for events via SMS, email, or shareable links';
COMMENT ON TABLE invitation_templates IS 'User-customizable templates for SMS and email invitations';
COMMENT ON TABLE guest_invitation_links IS 'Shareable links for public guest access to events';
COMMENT ON VIEW invitation_analytics IS 'Comprehensive view of invitation performance and response tracking'; 
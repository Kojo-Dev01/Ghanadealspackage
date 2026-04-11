-- Add user_id to inquiries so logged-in buyers can track their sent enquiries
ALTER TABLE inquiries ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_inquiries_user_id ON inquiries(user_id);

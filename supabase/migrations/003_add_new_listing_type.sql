-- Add 'new' to the listing_type enum for new development projects
ALTER TYPE listing_type ADD VALUE IF NOT EXISTS 'new';

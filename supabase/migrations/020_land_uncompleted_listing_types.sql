-- Add 'land' and 'uncompleted' to the listing_type enum
ALTER TYPE listing_type ADD VALUE IF NOT EXISTS 'land';
ALTER TYPE listing_type ADD VALUE IF NOT EXISTS 'uncompleted';

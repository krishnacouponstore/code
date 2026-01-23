-- Migration: Create banners table
-- Description: Stores configuration for the dynamic store banners. 
-- Note: Uses a table-specific trigger function to avoid Hasura tracking conflicts.

-- 1. Create the table
CREATE TABLE IF NOT EXISTS banners (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    
    -- Basic Config
    brand_name TEXT NOT NULL,
    primary_color VARCHAR(50) NOT NULL DEFAULT '#E23744',
    background_image_url TEXT,

    -- Badge
    is_badge_visible BOOLEAN DEFAULT true,
    badge_text VARCHAR(100),
    badge_icon VARCHAR(100),

    -- Text Content
    title_line_1 TEXT,
    title_line_2 TEXT,
    description TEXT,

    -- Call To Action
    button_text VARCHAR(50) DEFAULT 'View Offer',
    button_url TEXT,

    -- Offer Card
    offer_main_text VARCHAR(50),
    offer_sub_text VARCHAR(100),
    
    -- Icon Logic
    icon_mode VARCHAR(20) DEFAULT 'icon' CHECK (icon_mode IN ('icon', 'image')),
    card_icon_class VARCHAR(100), 
    icon_url_light TEXT,
    icon_url_dark TEXT,

    -- Metadata
    is_active BOOLEAN DEFAULT true,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

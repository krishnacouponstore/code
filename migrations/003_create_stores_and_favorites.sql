-- Migration: Create Stores, Tags, and User Favorites
-- Description: Introduces the Store entity, store tags, and user favorite stores.

-- 1. Create 'stores' table
CREATE TABLE IF NOT EXISTS public.stores (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    description TEXT,
    logo_url TEXT,
    theme_color VARCHAR(50), -- e.g., '#E23744'
    category VARCHAR(100),
    status VARCHAR(20) DEFAULT 'active', -- 'active', 'inactive', 'maintenance'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Create 'store_tags' table
CREATE TABLE IF NOT EXISTS public.store_tags (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
    value TEXT NOT NULL,
    color VARCHAR(50), -- Tag specific color (e.g. #FF0000 or tailwind class)
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Create 'user_favorite_stores' table
CREATE TABLE IF NOT EXISTS public.user_favorite_stores (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE, -- Link to user_profiles
    store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, store_id)
);

-- 4. Initial Seed Data
INSERT INTO public.stores (name, slug, description, logo_url, theme_color, category) VALUES
(
    'Flipkart Grocery', 
    'flipkart-grocery', 
    'Get instant ₹500 discount on your monthly grocery order. Verified codes available for Plus members.', 
    '/logos/flipkart-grocery.png', 
    '#2874f0', 
    'Groceries'
),
(
    'Shein', 
    'shein', 
    'Latest trends in fashion for women, men and kids.', 
    '/logos/shein.png', 
    '#000000', 
    'Fashion'
),
(
    'Mama''s Earth', 
    'mamas-earth', 
    'Goodness of Nature. Toxin-free, natural products for babies and moms.', 
    '/logos/mamaearth.png', 
    '#6cba48', 
    'Beauty'
),
(
    'Big Basket', 
    'big-basket', 
    'India''s largest online food and grocery store.', 
    '/logos/bigbasket.png', 
    '#84c225', 
    'Groceries'
)
ON CONFLICT (slug) DO NOTHING;

-- Optional: Add trigger for updated_at if the function exists
-- DATE: 2026-01-23

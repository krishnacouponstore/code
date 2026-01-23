-- Migration: Add tag_icon to store_tags and seed Netflix data
-- Description: Updates store_tags schema and adds Netflix store with tags.

-- 1. Add tag_icon to store_tags
ALTER TABLE public.store_tags 
ADD COLUMN IF NOT EXISTS tag_icon VARCHAR(100); -- e.g. 'fas fa-mobile-alt'

-- 2. Insert Netflix Store
INSERT INTO public.stores (name, slug, description, logo_url, theme_color, category, status)
VALUES (
    'Netflix',
    'netflix',
    'Unlimited movies, TV shows, and more. Watch anywhere. Cancel anytime.',
    '/logos/netflix.png',
    '#E50914',
    'Entertainment',
    'active'
)
ON CONFLICT (slug) DO NOTHING;

-- 3. Insert Netflix Tags
DO $$
DECLARE
    netflix_id UUID;
BEGIN
    SELECT id INTO netflix_id FROM public.stores WHERE slug = 'netflix';

    IF netflix_id IS NOT NULL THEN
        -- Tag 1: MOBILE
        INSERT INTO public.store_tags (store_id, value, color, tag_icon)
        VALUES (netflix_id, 'MOBILE', '#E50914', 'fas fa-mobile-alt');

        -- Tag 2: STANDARD
        INSERT INTO public.store_tags (store_id, value, color, tag_icon)
        VALUES (netflix_id, 'STANDARD', '#E50914', 'fas fa-tv');
    END IF;
END $$;

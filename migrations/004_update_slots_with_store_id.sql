-- Migration: Link Slots to Stores
-- Description: Adds store_id to slots table and migrates existing data based on slot names.

-- 1. Add store_id column (nullable first to allow migration)
ALTER TABLE public.slots 
ADD COLUMN IF NOT EXISTS store_id UUID;

-- 2. Migrate Data: Link Flipkart Grocery
-- Matches "Flipkart Grocery 50rs Off (15 Digit)", etc.
UPDATE public.slots
SET store_id = (SELECT id FROM public.stores WHERE slug = 'flipkart-grocery' LIMIT 1)
WHERE name ILIKE 'Flipkart Grocery%';

-- 3. Migrate Data: Link Shein
-- Matches "Shein ₹4000 Voucher"
UPDATE public.slots
SET store_id = (SELECT id FROM public.stores WHERE slug = 'shein' LIMIT 1)
WHERE name ILIKE 'Shein%';

-- 4. Migrate Data: Link Mama's Earth 
-- Matches "Mamaearth Rs.500 Off" (Note mapping: Mamaearth -> Mama's Earth)
UPDATE public.slots
SET store_id = (SELECT id FROM public.stores WHERE slug = 'mamas-earth' LIMIT 1)
WHERE name ILIKE 'Mamaearth%';

-- 5. Migrate Data: Link Big Basket
-- Matches "Big Basket ₹100 Cashback Coupon"
UPDATE public.slots
SET store_id = (SELECT id FROM public.stores WHERE slug = 'big-basket' LIMIT 1)
WHERE name ILIKE 'Big Basket%';

-- 6. Add Foreign Key Constraint
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_slots_store') THEN
        ALTER TABLE public.slots
        ADD CONSTRAINT fk_slots_store
        FOREIGN KEY (store_id)
        REFERENCES public.stores(id)
        ON DELETE SET NULL;
    END IF;
END $$;

-- 7. Add Index for performance
CREATE INDEX IF NOT EXISTS idx_slots_store_id ON public.slots(store_id);

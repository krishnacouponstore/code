-- Migration: Add thumbnail, expiry_date to slots table and create redemption_steps table
-- Date: 2026-01-19

-- Step 1: Add new columns to slots table
ALTER TABLE public.slots
ADD COLUMN IF NOT EXISTS thumbnail_url TEXT,
ADD COLUMN IF NOT EXISTS expiry_date TIMESTAMPTZ;

-- Add comment for new columns
COMMENT ON COLUMN public.slots.thumbnail_url IS 'Optional thumbnail/condition image URL for the coupon';
COMMENT ON COLUMN public.slots.expiry_date IS 'Optional expiry date for the coupon';

-- Step 2: Create redemption_steps table
CREATE TABLE IF NOT EXISTS public.redemption_steps (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    slot_id UUID NOT NULL REFERENCES public.slots(id) ON DELETE CASCADE,
    step_number INTEGER NOT NULL,
    step_text TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT redemption_steps_step_number_check CHECK (step_number > 0),
    CONSTRAINT redemption_steps_slot_id_step_number_key UNIQUE (slot_id, step_number)
);

-- Add indexes for redemption_steps
CREATE INDEX IF NOT EXISTS idx_redemption_steps_slot_id ON public.redemption_steps(slot_id);
CREATE INDEX IF NOT EXISTS idx_redemption_steps_slot_step ON public.redemption_steps(slot_id, step_number);

-- Add comment
COMMENT ON TABLE public.redemption_steps IS 'Stores step-by-step instructions for redeeming coupons';
COMMENT ON COLUMN public.redemption_steps.step_number IS 'Order of the step (1, 2, 3, etc.)';
COMMENT ON COLUMN public.redemption_steps.step_text IS 'The instruction text for this step';

-- Create trigger for updated_at
CREATE OR REPLACE FUNCTION set_redemption_steps_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_set_redemption_steps_updated_at
    BEFORE UPDATE ON public.redemption_steps
    FOR EACH ROW
    EXECUTE FUNCTION set_redemption_steps_updated_at();

-- GraphQL custom root fields (configure in Hasura console)
-- Table: redemption_steps
-- Custom root fields:
--   select: redemptionSteps
--   select_by_pk: redemptionStep
--   select_aggregate: redemptionStepsAggregate
--   insert: insertRedemptionSteps
--   insert_one: insertRedemptionStep
--   update: updateRedemptionSteps
--   update_by_pk: updateRedemptionStep
--   delete: deleteRedemptionSteps
--   delete_by_pk: deleteRedemptionStep

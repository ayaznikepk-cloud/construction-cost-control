-- Description-only BOQ parent rows do not carry a measurable unit.
-- Existing measurable rows retain their units and rates.
ALTER TABLE public.boq_items ALTER COLUMN unit_id DROP NOT NULL;

-- A parent heading must not be billed or measured directly.
ALTER TABLE public.boq_items ADD CONSTRAINT boq_description_rows_zero_value
CHECK (unit_id IS NOT NULL OR (original_quantity = 0 AND contract_rate = 0));

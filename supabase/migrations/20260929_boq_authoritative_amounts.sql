alter table public.boq_items
  add column if not exists rate_basis numeric(12,3) not null default 1,
  add column if not exists original_mrs_amount numeric(18,2),
  add column if not exists original_contract_amount numeric(18,2);

alter table public.boq_items drop constraint if exists boq_items_rate_basis_check;
alter table public.boq_items add constraint boq_items_rate_basis_check check (rate_basis > 0);

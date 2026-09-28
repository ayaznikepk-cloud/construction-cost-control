create or replace view public.v_boq_cost_summary as
select b.id as boq_item_id,b.project_id,b.boq_number,b.description,
coalesce(b.original_contract_amount,b.original_quantity*b.contract_rate/b.rate_basis) as contract_value,
coalesce((select sum(pe.quantity_today) from public.progress_entries pe where pe.boq_item_id=b.id),0::numeric) as executed_quantity,
coalesce((select sum(pe.quantity_today) from public.progress_entries pe where pe.boq_item_id=b.id),0::numeric)*b.contract_rate/b.rate_basis as earned_value,
coalesce((select sum(st.amount) from public.stock_transactions st where st.boq_item_id=b.id and st.txn_type='issue'),0::numeric) as material_cost,
coalesce((select sum(case ae.status when 'present' then w.daily_wage_rate when 'half_day' then w.daily_wage_rate/2 else 0 end+coalesce(ae.overtime_hours,0)*coalesce(w.overtime_rate,0)) from public.attendance_entries ae join public.workers w on w.id=ae.worker_id where ae.boq_item_id=b.id),0::numeric) as direct_labour_cost,
coalesce((select sum(lcm.quantity*lcri.agreed_rate) from public.labour_contract_measurements lcm join public.labour_contract_rate_items lcri on lcri.id=lcm.labour_contract_rate_item_id where lcri.boq_item_id=b.id),0::numeric) as labour_contractor_cost,
coalesce((select sum(sm.amount_certified) from public.subcontract_measurements sm join public.subcontracts sc on sc.id=sm.subcontract_id where sc.project_id=b.project_id),0::numeric) as subcontractor_cost_project_level,
coalesce((select sum(el.rental_cost+el.maintenance_cost) from public.equipment_logs el where el.boq_item_id=b.id),0::numeric) as machinery_cost,
coalesce((select sum(e.amount) from public.expenses e where e.boq_item_id=b.id and e.classification='direct_boq' and e.status='posted'),0::numeric) as direct_expense_cost
from public.boq_items b;

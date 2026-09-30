alter table public.documents
  add column if not exists category text,
  add column if not exists reference text,
  add column if not exists document_date date,
  add column if not exists notes text;

create index if not exists idx_documents_project_date
  on public.documents(project_id, document_date desc);

create index if not exists idx_documents_project_category
  on public.documents(project_id, category);

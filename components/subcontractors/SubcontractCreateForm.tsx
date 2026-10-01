"use client";

import { useMemo, useState } from "react";

type Project = { id: string; project_code: string; project_name: string };
type Subcontractor = { id: string; name: string };

type SearchItem = { id: string; label: string; search: string };

function SearchPicker({
  name,
  placeholder,
  items,
  required = false,
}: {
  name: string;
  placeholder: string;
  items: SearchItem[];
  required?: boolean;
}) {
  const [selectedId, setSelectedId] = useState("");
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);

  const matches = useMemo(() => {
    const term = query.trim().toLowerCase();
    return items.filter((item) => !term || item.search.includes(term)).slice(0, 50);
  }, [items, query]);

  return (
    <div className="relative min-w-0">
      <input type="hidden" name={name} value={selectedId} />
      <input
        required={required}
        value={query}
        autoComplete="off"
        role="combobox"
        aria-expanded={open}
        onFocus={() => setOpen(true)}
        onBlur={() => setTimeout(() => setOpen(false), 150)}
        onChange={(event) => {
          setQuery(event.target.value);
          setSelectedId("");
          setOpen(true);
        }}
        placeholder={placeholder}
        className="h-10 min-w-0 w-full rounded-md border border-border px-3 text-sm"
      />
      {open && (
        <div className="absolute z-30 mt-1 max-h-64 w-full overflow-y-auto rounded-md border border-border bg-white shadow-lg">
          {matches.length ? (
            matches.map((item) => (
              <button
                key={item.id}
                type="button"
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => {
                  setSelectedId(item.id);
                  setQuery(item.label);
                  setOpen(false);
                }}
                className="block w-full border-b border-border px-3 py-2 text-left text-sm last:border-0 hover:bg-gray-50"
              >
                {item.label}
              </button>
            ))
          ) : (
            <div className="p-3 text-sm text-gray-500">No matching records.</div>
          )}
        </div>
      )}
    </div>
  );
}

export default function SubcontractCreateForm({
  action,
  projects,
  subcontractors,
}: {
  action: (formData: FormData) => void | Promise<void>;
  projects: Project[];
  subcontractors: Subcontractor[];
}) {
  const projectItems = useMemo(
    () =>
      projects.map((project) => ({
        id: project.id,
        label: `${project.project_code} — ${project.project_name}`,
        search: `${project.project_code} ${project.project_name}`.toLowerCase(),
      })),
    [projects]
  );

  const subcontractorItems = useMemo(
    () =>
      subcontractors.map((subcontractor) => ({
        id: subcontractor.id,
        label: subcontractor.name,
        search: subcontractor.name.toLowerCase(),
      })),
    [subcontractors]
  );

  return (
    <form action={action} className="mt-4 grid min-w-0 items-start gap-3 md:grid-cols-2 lg:grid-cols-3">
      <div className="min-w-0">
        <label className="mb-1 block text-xs font-medium text-gray-600">Project</label>
        <SearchPicker
          name="project_id"
          required
          placeholder="Search project code or name"
          items={projectItems}
        />
      </div>

      <div className="min-w-0">
        <label className="mb-1 block text-xs font-medium text-gray-600">Subcontractor</label>
        <SearchPicker
          name="subcontractor_id"
          required
          placeholder="Search subcontractor"
          items={subcontractorItems}
        />
        <p className="mt-1 text-[11px] text-gray-500">Active subcontractors from Setup.</p>
      </div>

      <div className="min-w-0">
        <label className="mb-1 block text-xs font-medium text-gray-600">Contract value (Rs)</label>
        <input
          name="contract_value"
          required
          type="number"
          min=".01"
          step=".01"
          placeholder="Contract value"
          className="h-10 min-w-0 w-full rounded-md border border-border px-3 text-sm"
        />
      </div>

      <div className="min-w-0">
        <label className="mb-1 block text-xs font-medium text-gray-600">Retention %</label>
        <input
          name="retention_percentage"
          type="number"
          min="0"
          max="100"
          step=".01"
          placeholder="Retention %"
          className="h-10 min-w-0 w-full rounded-md border border-border px-3 text-sm"
        />
      </div>

      <div className="min-w-0 md:col-span-2 lg:col-span-1">
        <label className="mb-1 block text-xs font-medium text-gray-600">Scope / work description</label>
        <input
          name="scope_description"
          placeholder="Scope / work description"
          className="h-10 min-w-0 w-full rounded-md border border-border px-3 text-sm"
        />
      </div>

      <button className="h-10 rounded-md bg-active px-4 text-sm font-medium text-white md:col-span-2 lg:col-span-1 lg:self-end">
        Create subcontract
      </button>
    </form>
  );
}

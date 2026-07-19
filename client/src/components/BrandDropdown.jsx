import { useState } from "react";

export default function BrandDropdown({
  brands,
  selectedId,
  onSelect,
  onCreated,
}) {
  const [newName, setNewName] = useState("");
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState("");

  async function handleCreate(e) {
    e.preventDefault();
    if (!newName.trim()) return;

    setCreating(true);
    setError("");
    try {
      await onCreated(newName.trim());
      setNewName("");
    } catch (err) {
      setError(err.message);
    } finally {
      setCreating(false);
    }
  }

  return (
    <div className="space-y-4 rounded-[10px] border border-slate-200 bg-white p-4">
      <label className="block text-[13px] font-semibold text-slate-500">
        Brand
        <select
          className="mt-1.5 block w-full rounded-[8px] border border-slate-200 bg-white px-3 py-2 text-[14px] text-slate-900 outline-none focus:border-slate-400"
          value={selectedId || ""}
          onChange={(e) => onSelect(e.target.value || null)}
        >
          <option value="">Select a brand…</option>
          {brands.map((b) => (
            <option key={b._id} value={b._id}>
              {b.name}
            </option>
          ))}
        </select>
      </label>

      <form onSubmit={handleCreate} className="flex flex-col gap-2 sm:flex-row">
        <input
          type="text"
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          placeholder="New brand name"
          className="min-w-0 flex-1 rounded-[8px] border border-slate-200 px-3 py-2 text-[14px] outline-none focus:border-slate-400"
        />
        <button
          type="submit"
          disabled={creating || !newName.trim()}
          className="shrink-0 rounded-[8px] bg-slate-900 px-4 py-2 text-[14px] text-white disabled:opacity-50"
        >
          {creating ? "Creating…" : "Create"}
        </button>
      </form>

      {error && <p className="text-[14px] text-red-600">{error}</p>}
    </div>
  );
}

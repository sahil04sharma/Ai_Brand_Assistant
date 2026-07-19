import { useCallback, useEffect, useState } from "react";
import BrandDropdown from "./components/BrandDropdown";
import ChatWindow from "./components/ChatWindow";
import StatePanel from "./components/StatePanel";
import {
  createBrand,
  getBrandById,
  getBrands,
  sendChat,
} from "./api";

export default function App() {
  const [brands, setBrands] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [brand, setBrand] = useState(null);
  const [loadingBrand, setLoadingBrand] = useState(false);
  const [listError, setListError] = useState("");

  const refreshBrands = useCallback(async () => {
    const list = await getBrands();
    setBrands(list);
    return list;
  }, []);

  useEffect(() => {
    refreshBrands().catch((err) => setListError(err.message));
  }, [refreshBrands]);

  // Fully reload brand on switch — clears previous brand from UI
  useEffect(() => {
    if (!selectedId) {
      setBrand(null);
      return;
    }

    let cancelled = false;
    setBrand(null);
    setLoadingBrand(true);

    getBrandById(selectedId)
      .then((data) => {
        if (!cancelled) setBrand(data);
      })
      .catch((err) => {
        if (!cancelled) {
          setBrand(null);
          setListError(err.message);
        }
      })
      .finally(() => {
        if (!cancelled) setLoadingBrand(false);
      });

    return () => {
      cancelled = true;
    };
  }, [selectedId]);

  async function handleCreated(name) {
    const created = await createBrand(name);
    await refreshBrands();
    setSelectedId(created._id);
  }

  async function handleSend(message) {
    await sendChat(selectedId, message);
    const updated = await getBrandById(selectedId);
    setBrand(updated);
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <header className="border-b border-slate-200 bg-white px-6 py-4">
        <h1 className="text-xl font-semibold tracking-tight">
          AI Brand Assistant
        </h1>
        <p className="text-sm text-slate-500">
          Multi-brand chat with isolated context
        </p>
      </header>

      <main className="mx-auto grid max-w-6xl gap-4 p-6 lg:grid-cols-[1fr_280px]">
        <section className="space-y-4">
          {listError && (
            <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
              {listError}
            </p>
          )}

          <BrandDropdown
            brands={brands}
            selectedId={selectedId}
            onSelect={setSelectedId}
            onCreated={handleCreated}
          />

          {loadingBrand ? (
            <div className="rounded-md border border-slate-200 bg-white p-6 text-sm text-slate-500">
              Loading brand…
            </div>
          ) : (
            <ChatWindow
              brand={brand}
              onSend={handleSend}
              disabled={!selectedId}
            />
          )}
        </section>

        <aside>
          <StatePanel brand={loadingBrand ? null : brand} />
        </aside>
      </main>
    </div>
  );
}
